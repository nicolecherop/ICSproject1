import React, { useState } from 'react';
import './Userprofile.css';

const Userprofile = () => {
  const [activeTab, setActiveTab] = useState('Vehicle Entry');
  const [formData, setFormData] = useState({
    username: '',
    numberplate: '',
    carDescription: ''
  });

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
      setFormData({
        username: '',
        numberplate: '',
        carDescription: ''
      });
    } else {
      alert('Username and Number Plate are required!');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Add your logout logic here (e.g., clearing auth token, redirecting)
      console.log('User logged out');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Left Navigation Bar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Staff Dashboard</h2>
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

      {/* Main Content Area */}
      <div className="main-content">
        {activeTab === 'Vehicle Entry' && (
          <div className="form-container">
            <h2>Vehicle Information Entry</h2>
            <form id="vehicleForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="numberplate">Number Plate</label>
                <input
                  type="text"
                  id="numberplate"
                  name="numberplate"
                  value={formData.numberplate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="carDescription">Car Description</label>
                <textarea
                  id="carDescription"
                  name="carDescription"
                  rows="4"
                  value={formData.carDescription}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <button type="submit" className="submit-button">
                Submit
              </button>
            </form>
          </div>
        )}

        {activeTab === 'Submission History' && (
          <div className="history-container">
            <h2>Submission History</h2>
            {/* History content would go here */}
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="settings-container">
            <h2>Settings</h2>
            {/* Settings content would go here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Userprofile;