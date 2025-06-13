import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Userprofile.css';
import { jwtDecode } from 'jwt-decode';

const Userprofile = () => {
  const [activeTab, setActiveTab] = useState('Vehicle Entry');
  const [formData, setFormData] = useState({
    email: '',
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
  const [submissions, setSubmissions] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
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
            email: user.email || ''
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
            email: parsedData.email || ''
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
          email: userInfo.email
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

  useEffect(() => {
    if (activeTab === 'Submission History') {
      fetchSubmissions();
    }
  }, [activeTab]);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        navigate('/Stafflogin');
        return;
      }

      const response = await fetch('http://localhost:5000/api/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data);
    } catch (err) {
      setError(err.message || 'Failed to load submission history');
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSubmitSuccess(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        navigate('/Stafflogin');
        return;
      }

      const response = await fetch('http://localhost:5000/api/submit-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: formData.email,
          numberplate: formData.numberplate,
          carDescription: formData.carDescription
        })
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      const data = await response.json(); 

      setSubmitSuccess(true);
      setFormData(prev => ({
        ...prev,
        numberplate: '',
        carDescription: ''
      }));
      
      // Refresh submissions if on history tab
      if (activeTab === 'Submission History') {
        fetchSubmissions();
      }

      // Hide success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit vehicle information');
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
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="main-content">
        {submitSuccess && (
          <div className="success-message">
            Vehicle information submitted successfully!
          </div>
        )}

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
                  disabled
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
            {submissions.length === 0 ? (
              <div className="history-placeholder">
                <p>No submissions found</p>
              </div>
            ) : (
              <table className="submissions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Number Plate</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission, index) => (
                    <tr key={index}>
                      <td>{new Date(submission.createdAt).toLocaleString()}</td>
                      <td>{submission.numberplate}</td>
                      <td>{submission.carDescription || 'N/A'}</td>
                      <td>{submission.status || 'Submitted'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Userprofile;