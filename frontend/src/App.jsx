import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configure API URL - update this for deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [checklist, setChecklist] = useState({
    pushups: false,
    situps: false,
    ab_crunches: false,
    cigarettes: 0,
    oiling: false,
    facemask: false,
    steps: ''
  });
  const [streaks, setStreaks] = useState({
    pushups: 0,
    situps: 0,
    ab_crunches: 0,
    oiling: 0,
    facemask: 0
  });
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  // Check if user is logged in on app load
  useEffect(() => {
    if (token) {
      loadChecklist();
      loadStreaks();
    }
  }, [token, selectedDate]);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/token`, {
        username,
        password
      });

      const { access_token } = response.data;
      setToken(access_token);
      localStorage.setItem('token', access_token);
      setUser({ username });
      setMessage('Login successful!');

      // Load initial data
      loadChecklist();
      loadStreaks();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/register`, {
        username,
        email,
        password
      });

      setMessage('Registration successful! Please login.');
      setShowLogin(true);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setMessage('Logged out successfully');
  };

  const loadChecklist = async () => {
    try {
      const response = await axios.get(`${API_URL}/checklist/${selectedDate}`);
      setChecklist(response.data);
    } catch (error) {
      console.error('Failed to load checklist:', error);
    }
  };

  const loadStreaks = async () => {
    try {
      const response = await axios.get(`${API_URL}/streaks`);
      setStreaks(response.data);
    } catch (error) {
      console.error('Failed to load streaks:', error);
    }
  };

  const saveChecklist = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/checklist`, {
        ...checklist,
        date: selectedDate,
        steps: checklist.steps === '' ? null : parseInt(checklist.steps)
      });

      setMessage('Checklist saved successfully!');
      loadStreaks(); // Refresh streaks after saving
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to save checklist');
    } finally {
      setLoading(false);
    }
  };

  const isValidDay = (activity) => {
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

    if (activity === 'oiling') {
      return dayOfWeek === 2 || dayOfWeek === 6; // Tuesday or Saturday
    } else if (activity === 'facemask') {
      return dayOfWeek === 3 || dayOfWeek === 6; // Wednesday or Saturday
    }
    return true;
  };

  const AuthForm = () => {
    const [formData, setFormData] = useState({
      username: '',
      email: '',
      password: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (showLogin) {
        login(formData.username, formData.password);
      } else {
        register(formData.username, formData.email, formData.password);
      }
    };

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-6">
            {showLogin ? 'Login' : 'Register'}
          </h2>

          {message && (
            <div className={`mb-4 p-3 rounded ${
              message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            {!showLogin && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (showLogin ? 'Login' : 'Register')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setShowLogin(!showLogin);
                setMessage('');
              }}
              className="text-blue-500 hover:text-blue-700"
            >
              {showLogin ? 'Need an account? Register' : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!token) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Well-Being Tracker</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.username}</span>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Date</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Streaks Display */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Streaks</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(streaks).map(([activity, count]) => (
              <div key={activity} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {activity.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Daily Checklist - {selectedDate}
          </h2>

          <div className="space-y-4">
            {/* Checkbox items */}
            {[
              { key: 'pushups', label: '100 Pushups' },
              { key: 'situps', label: '100 Situps' },
              { key: 'ab_crunches', label: '100 Ab Crunches' },
              { key: 'oiling', label: 'Oiling (Tue/Sat only)' },
              { key: 'facemask', label: 'Facemask (Wed/Sat only)' }
            ].map(item => (
              <div key={item.key} className="flex items-center">
                <input
                  type="checkbox"
                  id={item.key}
                  checked={checklist[item.key]}
                  disabled={
                    (item.key === 'oiling' && !isValidDay('oiling')) ||
                    (item.key === 'facemask' && !isValidDay('facemask'))
                  }
                  onChange={(e) => setChecklist({
                    ...checklist,
                    [item.key]: e.target.checked
                  })}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={item.key}
                  className={`text-sm font-medium ${
                    ((item.key === 'oiling' && !isValidDay('oiling')) ||
                     (item.key === 'facemask' && !isValidDay('facemask'))) 
                      ? 'text-gray-400' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </label>
              </div>
            ))}

            {/* Number inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Cigarettes
                </label>
                <input
                  type="number"
                  min="0"
                  value={checklist.cigarettes}
                  onChange={(e) => setChecklist({
                    ...checklist,
                    cigarettes: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Steps (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={checklist.steps}
                  onChange={(e) => setChecklist({
                    ...checklist,
                    steps: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={saveChecklist}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Checklist'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;