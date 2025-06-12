import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Userprofile.css';
import { jwtDecode } from 'jwt-decode';

const Userprofile = () => {
  const [activeTab, setActiveTab] = useState('Vehicle Entry');
  const [formData, setFormData] = useState({
    username: '',
    numberplate: '',
    carDescription: ''
  });
  const [userData, setUserData] = useState({
    name: 'User',
    email: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (location.state?.user) {
          const { user } = location.state;
          setUserData({
            name: user.name || 'User',
            email: user.email || '',
            role: user.role || 'user'
          });
          setFormData(prev => ({
            ...prev,
            username: user.name || ''
          }));
          setLoading(false);
          return;
        }

        const storedData = localStorage.getItem('userData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setUserData({
            name: parsedData.name || 'User',
            email: parsedData.email || '',
            role: parsedData.role || 'user'
          });
          setFormData(prev => ({
            ...prev,
            username: parsedData.name || ''
          }));
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('staffToken');
        if (!token) {
          navigate('/Stafflogin');
          return;
        }

        const decoded = jwtDecode(token);
        const response = await fetch(`http://localhost:5000/api/user/${decoded.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        const userInfo = {
          name: data.name || `${data.firstname || ''} ${data.lastname || ''}`.trim() || 'User',
          email: data.email || '',
          role: data.role || 'user'
        };

        setUserData(userInfo);
        localStorage.setItem('userData', JSON.stringify(userInfo));
        setFormData(prev => ({
          ...prev,
          username: userInfo.name
        }));

      } catch (err) {
        setError(err.message || 'Failed to load profile data');
        navigate('/Stafflogin');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, location.state]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.username && formData.numberplate) {
      alert(`Submitted:\nUsername: ${formData.username}\nNumber Plate: ${formData.numberplate}`);
      setFormData(prev => ({
        ...prev,
        numberplate: '',
        carDescription: ''
      }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('userData');
    navigate('/Stafflogin', { replace: true });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Welcome, {userData.name}</h2>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-button ${activeTab === 'Vehicle Entry' ? 'active' : ''}`}
            onClick={() => handleTabChange('Vehicle Entry')}
          >
            Vehicle Entry
          </button>
          <button
            className={`nav-button ${activeTab === 'Submission History' ? 'active' : ''}`}
            onClick={() => handleTabChange('Submission History')}
          >
            Submission History
          </button>
          <button
            className={`nav-button ${activeTab === 'Settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('Settings')}
          >
            Settings
          </button>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="main-content">
        {activeTab === 'Vehicle Entry' && (
          <div className="form-container">
            <h2>Vehicle Information Entry</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Number Plate</label>
                <input
                  type="text"
                  name="numberplate"
                  value={formData.numberplate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Car Description</label>
                <textarea
                  name="carDescription"
                  rows="4"
                  value={formData.carDescription}
                  onChange={handleInputChange}
                />
              </div>
              <button type="submit" className="submit-button">
                Submit
              </button>
            </form>
          </div>
        )}

        {activeTab === 'Submission History' && (
          <div className="history-container">
            <h2>Your Submission History</h2>
            <div className="history-placeholder">
              <p>Your previous submissions will appear here</p>
            </div>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="settings-container">
            <h2>Account Settings</h2>
            <div className="user-info-card">
              <h3>Personal Information</h3>
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{userData.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{userData.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Account Type:</span>
                <span className="info-value">{userData.role?.toUpperCase() || 'USER'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Userprofile;