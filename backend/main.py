from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

# Initialize FastAPI app
app = FastAPI(title="Well-Being Tracker API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
client = AsyncIOMotorClient(MONGODB_URI)
db = client.wellbeing_tracker

# Security
security = HTTPBearer()


# Pydantic models
class User(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ChecklistItem(BaseModel):
    pushups: bool = False
    situps: bool = False
    ab_crunches: bool = False
    cigarettes: int = 0
    oiling: bool = False
    facemask: bool = False
    steps: Optional[int] = None
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))


class StreakData(BaseModel):
    pushups: int = 0
    situps: int = 0
    ab_crunches: int = 0
    oiling: int = 0
    facemask: int = 0


# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user


def is_valid_day_for_activity(activity: str, date_str: str) -> bool:
    """Check if the given date is valid for specific activities"""
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        weekday = date_obj.weekday()  # 0=Monday, 1=Tuesday, ..., 6=Sunday

        if activity == "oiling":
            return weekday in [1, 5]  # Tuesday and Saturday
        elif activity == "facemask":
            return weekday in [2, 5]  # Wednesday and Saturday

        return True
    except ValueError:
        return False


async def calculate_streaks(username: str) -> Dict[str, int]:
    """Calculate current streaks for checkbox items"""
    # Get all checklist entries for the user, sorted by date descending
    entries = await db.checklists.find(
        {"username": username}
    ).sort("date", -1).to_list(None)

    if not entries:
        return {"pushups": 0, "situps": 0, "ab_crunches": 0, "oiling": 0, "facemask": 0}

    streaks = {"pushups": 0, "situps": 0, "ab_crunches": 0, "oiling": 0, "facemask": 0}

    # Convert to dict with date as key for easier processing
    entries_dict = {entry["date"]: entry for entry in entries}

    # Start from today and go backwards
    current_date = datetime.now().date()

    for activity in streaks.keys():
        streak_count = 0
        check_date = current_date

        while True:
            date_str = check_date.strftime("%Y-%m-%d")

            # Check if this activity is valid for this day
            if not is_valid_day_for_activity(activity, date_str):
                check_date -= timedelta(days=1)
                continue

            # Check if we have an entry for this date
            if date_str in entries_dict:
                entry = entries_dict[date_str]
                if entry.get(activity, False):
                    streak_count += 1
                else:
                    break
            else:
                break

            check_date -= timedelta(days=1)

        streaks[activity] = streak_count

    return streaks


# API Routes
@app.post("/register", response_model=dict)
async def register(user: User):
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )

    existing_email = await db.users.find_one({"email": user.email})
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash password and save user
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }

    await db.users.insert_one(user_doc)
    return {"message": "User registered successfully"}


@app.post("/token", response_model=Token)
async def login(user: UserLogin):
    # Authenticate user
    db_user = await db.users.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/checklist")
async def save_checklist(checklist: ChecklistItem, current_user: dict = Depends(get_current_user)):
    # Validate day-specific activities
    if checklist.oiling and not is_valid_day_for_activity("oiling", checklist.date):
        raise HTTPException(
            status_code=400,
            detail="Oiling is only allowed on Tuesdays and Saturdays"
        )

    if checklist.facemask and not is_valid_day_for_activity("facemask", checklist.date):
        raise HTTPException(
            status_code=400,
            detail="Facemask is only allowed on Wednesdays and Saturdays"
        )

    # Prepare checklist document
    checklist_doc = checklist.dict()
    checklist_doc["username"] = current_user["username"]
    checklist_doc["updated_at"] = datetime.utcnow()

    # Upsert checklist entry
    await db.checklists.replace_one(
        {"username": current_user["username"], "date": checklist.date},
        checklist_doc,
        upsert=True
    )

    return {"message": "Checklist saved successfully"}


@app.get("/checklist/{date}")
async def get_checklist(date: str, current_user: dict = Depends(get_current_user)):
    checklist = await db.checklists.find_one(
        {"username": current_user["username"], "date": date}
    )

    if not checklist:
        # Return default checklist for the date
        return ChecklistItem(date=date).dict()

    # Remove MongoDB internal fields
    checklist.pop("_id", None)
    checklist.pop("username", None)
    checklist.pop("updated_at", None)

    return checklist


@app.get("/streaks", response_model=StreakData)
async def get_streaks(current_user: dict = Depends(get_current_user)):
    streaks = await calculate_streaks(current_user["username"])
    return StreakData(**streaks)


@app.get("/")
async def root():
    return {"message": "Well-Being Tracker API is running!"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)