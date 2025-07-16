# Well-Being Tracker App

A comprehensive web application for tracking daily well-being activities with user authentication, streak tracking, and persistent data storage.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Daily Checklist**: Track various health activities:
  - 100 Pushups ✓
  - 100 Situps ✓
  - 100 Ab Crunches ✓
  - Number of Cigarettes (numeric input)
  - Oiling (Tuesday and Saturday only)
  - Facemask (Wednesday and Saturday only)
  - Number of Steps (optional)
- **Streak Tracking**: Automatic calculation of consecutive completion streaks
- **Date Navigation**: View and edit past checklist entries
- **Mobile-Friendly**: Responsive design with Tailwind CSS
- **Persistent Storage**: MongoDB database with cloud hosting support

## Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **MongoDB**: NoSQL database with Motor async driver
- **JWT Authentication**: Secure token-based authentication
- **bcrypt**: Password hashing for security
- **Pydantic**: Data validation and settings management

### Frontend
- **React**: Modern JavaScript library for building user interfaces
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API requests

### Deployment
- **Docker**: Containerization for consistent deployment
- **Docker Compose**: Multi-container application orchestration
- **Render**: Cloud platform for hosting (free tier available)
- **MongoDB Atlas**: Cloud database service (free tier available)

## Project Structure

```
wellbeing-tracker/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables
│   └── Dockerfile          # Backend container configuration
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Tailwind CSS imports
│   ├── package.json        # Node.js dependencies
│   ├── vite.config.js      # Vite configuration
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── postcss.config.js   # PostCSS configuration
│   ├── nginx.conf          # Nginx configuration for production
│   ├── index.html          # HTML template
│   └── Dockerfile          # Frontend container configuration
├── docker-compose.yml      # Local development orchestration
└── README.md              # This file
```

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git for version control
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd wellbeing-tracker
```

### 2. Local Development with Docker

1. **Start all services:**
```bash
docker-compose up --build
```

2. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - MongoDB: localhost:27017

3. **Stop services:**
```bash
docker-compose down
```

### 3. Local Development without Docker

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/wellbeing_tracker
SECRET_KEY=your-super-secret-key-change-this-in-production
```

Start MongoDB locally and run:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

### MongoDB Atlas Setup

1. **Create MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account and cluster

2. **Configure Database:**
   - Create a database user with read/write permissions
   - Add your IP address to the IP whitelist (or use 0.0.0.0/0 for all IPs)
   - Get your connection string

3. **Update Connection String:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/wellbeing_tracker
   ```

### Render Deployment

#### Deploy Backend

1. **Create Render Account:**
   - Go to [Render](https://render.com) and create an account
   - Connect your GitHub repository

2. **Create Web Service:**
   - Choose "Web Service" from the dashboard
   - Connect your repository
   - Configure service:
     - **Name**: wellbeing-tracker-backend
     - **Environment**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
     - **Root Directory**: `backend`

3. **Set Environment Variables:**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `SECRET_KEY`: A secure random string (generate with `openssl rand -hex 32`)

#### Deploy Frontend

1. **Create Another Web Service:**
   - **Name**: wellbeing-tracker-frontend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
   - **Root Directory**: `frontend`

2. **Set Environment Variables:**
   - `VITE_API_URL`: Your backend service URL (e.g., `https://wellbeing-tracker-backend.onrender.com`)

#### Alternative Frontend Deployment (Static Site)

You can also deploy the frontend as a static site:

1. **Build the frontend:**
```bash
cd frontend
npm run build
```

2. **Deploy to Render Static Site:**
   - Choose "Static Site" from Render dashboard
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

## API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /token` - Login and receive JWT token

### Checklist
- `POST /checklist` - Save checklist data for a specific date
- `GET /checklist/{date}` - Retrieve checklist data for a specific date
- `GET /streaks` - Get current streak data for checkbox items

### Example API Usage

```javascript
// Register user
const response = await fetch('/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'secure_password'
  })
});

// Login
const tokenResponse = await fetch('/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    password: 'secure_password'
  })
});

// Save checklist
const checklistResponse = await fetch('/checklist', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    pushups: true,
    situps: true,
    ab_crunches: false,
    cigarettes: 2,
    oiling: true, // Only on Tue/Sat
    facemask: false,
    steps: 8000,
    date: '2024-01-15'
  })
});
```

## Usage Guide

### First Time Setup
1. **Register**: Create an account with username, email, and password
2. **Login**: Use your credentials to access the application
3. **Complete Checklist**: Mark activities as complete for today

### Daily Usage
1. **View Today's Checklist**: The app loads today's date by default
2. **Mark Completed Activities**: Check off completed tasks
3. **Enter Numeric Values**: Input cigarette count and steps
4. **Save**: Click "Save Checklist" to persist your data
5. **View Streaks**: See your current consecutive completion streaks

### Features
- **Date Navigation**: Use the date picker to view/edit past entries
- **Day-Specific Activities**: Oiling and facemask options are only available on designated days
- **Streak Tracking**: Automatically calculates streaks for checkbox items
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Security Features

- **Password Hashing**: bcrypt encryption for stored passwords
- **JWT Authentication**: Secure token-based session management
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Pydantic models for data validation
- **Environment Variables**: Secure configuration management

## Troubleshooting

### Common Issues

1. **"ModuleNotFoundError" in backend:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Frontend not connecting to backend:**
   - Check `VITE_API_URL` environment variable
   - Verify backend is running and accessible
   - Check browser console for CORS errors

3. **Database connection issues:**
   - Verify MongoDB URI in environment variables
   - Check MongoDB Atlas IP whitelist
   - Ensure database user has proper permissions

4. **Docker build failures:**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up
   ```

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reloading during development
2. **API Testing**: Use the FastAPI automatic docs at `http://localhost:8000/docs`
3. **Database Inspection**: Use MongoDB Compass or Atlas web interface to inspect data
4. **Logs**: Check Docker logs with `docker-compose logs <service-name>`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature description'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is open-source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed description and steps to reproduce

## Future Enhancements

- **Analytics Dashboard**: Visualize progress trends with charts
- **Push Notifications**: Remind users to complete daily tasks
- **Social Features**: Share progress with friends
- **Custom Activities**: Allow users to define their own checklist items
- **Export Data**: Download progress history as CSV/PDF
- **Mobile App**: React Native version for iOS and Android