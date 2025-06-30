import React, { useState, useEffect,useRef,useCallback    } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { FaCamera, FaCheckCircle, FaTimesCircle, FaHistory } from 'react-icons/fa';


import { 
  FaHome, 
  FaUsers, 
  FaChartBar, 
  FaCog,
  FaUserCircle,
  FaTrash,
  FaSearch,
  FaSignOutAlt,
  FaSync,
  FaPrint
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVisitors: 0,
    pendingVehicles: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('staffToken');
      
      // Fetch stats
      const statsResponse = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch vehicles
      const vehiclesResponse = await fetch('http://localhost:5000/api/admin/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!statsResponse.ok || !vehiclesResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsResponse.json();
      const vehiclesData = await vehiclesResponse.json();

      setStats({
        totalUsers: statsData.totalUsers,
        totalVisitors: statsData.totalVisitors,
        pendingVehicles: statsData.pendingVehicles
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('userData');
    navigate('/Stafflogin');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return <DashboardContent 
          stats={stats} 
          loading={loading} 
          error={error}
          refreshData={fetchDashboardData} 
        />;
      case 'users': return <UsersContent />;
      case 'visitors': return <VisitorsContent />;
      case 'vehicles': return <VehiclesContent />;
      case 'gateaccess': return <GateAccessContent />;
      case 'entrylogs': return <EntrylogsContent />;
      default: 
        return <DashboardContent 
          stats={stats} 
          loading={loading} 
          error={error}
          refreshData={fetchDashboardData} 
        />;
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>

        <nav>
          <ul>
            <li 
              className={activeTab === 'dashboard' ? 'active' : ''}
              onClick={() => setActiveTab('dashboard')}
            >
              <FaHome className="icon" />
              <span>Dashboard</span>
            </li>
            <li 
              className={activeTab === 'users' ? 'active' : ''}
              onClick={() => setActiveTab('users')}
            >
              <FaUsers className="icon" />
              <span>Users</span>
            </li>
            <li 
              className={activeTab === 'visitors' ? 'active' : ''}
              onClick={() => setActiveTab('visitors')}
            >
              <FaUsers className="icon" />
              <span>Visitors</span>
            </li>
            <li 
              className={activeTab === 'vehicles' ? 'active' : ''}
              onClick={() => setActiveTab('vehicles')}
            >
              <FaChartBar className="icon" />
              <span>Vehicles</span>
            </li>
            <li 
              className={activeTab === 'gateaccess' ? 'active' : ''}
              onClick={() => setActiveTab('gateaccess')}
            >
              <FaCamera className="icon" />
              <span>Camera access</span>
            </li>
            <li 
              className={activeTab === 'entrylogs' ? 'active' : ''}
              onClick={() => setActiveTab('entrylogs')}
            >
              <FaCog className="icon" />
              <span>Entry Logs</span>
            </li>
          </ul>
        </nav>

        <div className="logout-container">
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt className="icon" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div className="user-profile">
            <span>Admin User</span>
            <FaUserCircle className="avatar" />
          </div>
        </header>

        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const DashboardContent = ({ stats, loading, error, refreshData }) => {
  const [localLoading, setLocalLoading] = useState(false);

  const handleRefresh = async () => {
    try {
      setLocalLoading(true);
      await refreshData();
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h2>Overview</h2>
        <button 
          onClick={handleRefresh} 
          className="refresh-btn"
          disabled={localLoading || loading}
        >
          {localLoading ? <FaSync className="spin" /> : <FaSync />}
          {localLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}
      
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Users</h3>
          {loading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <p>{stats.totalUsers}</p>
              {stats.totalUsers === 0 && (
                <small className="warning">No users found</small>
              )}
            </>
          )}
        </div>
        <div className="stat-card">
          <h3>Visitors</h3>
          {loading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <p>{stats.totalVisitors}</p>
              {stats.totalVisitors === 0 && (
                <small className="warning">No visitors found</small>
              )}
            </>
          )}
        </div>
        <div className="stat-card">
          <h3>Pending Vehicles</h3>
          {loading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <p>{stats.pendingVehicles}</p>
              {stats.pendingVehicles === 0 && (
                <small className="warning">No pending vehicles</small>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const UsersContent = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      let data = await response.json();
      // Filter out admin users
      data = data.filter(user => user.role !== 'admin');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (userId) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to delete user');
      
      // Refresh the user list
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter(user => 
    `${user.firstname} ${user.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading-spinner"></div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="users-content">
      <h2>User Management</h2>
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input 
          type="text" 
          placeholder="Search users..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Delete Confirmation Card */}
      {showDeleteConfirm && (
        <div className="confirmation-card">
          <div className="confirmation-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this user?</p>
            <div className="confirmation-buttons">
              <button 
                className="confirm-btn"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.firstname} {user.lastname}</td>
                <td>{user.email}</td>
                <td>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteClick(user.id)}
                  >
                    <FaTrash /> Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="no-results">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const VisitorsContent = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch('http://localhost:5000/api/admin/visitors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch visitors');
      
      const data = await response.json();
      setVisitors(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredVisitors = visitors.filter(visitor => 
    `${visitor.first_name} ${visitor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.number_plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading-spinner"></div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="visitors-content">
      <h2>Visitors Management</h2>
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input 
          type="text" 
          placeholder="Search visitors..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Vehicle</th>
            <th>Visit Date</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {filteredVisitors.length > 0 ? (
            filteredVisitors.map(visitor => (
              <tr key={visitor.id}>
                <td>{visitor.id}</td>
                <td>{visitor.first_name} {visitor.last_name}</td>
                <td>{visitor.email}</td>
                <td>{visitor.number_plate}</td>
                <td>{new Date(visitor.visit_date).toLocaleDateString()}</td>
                <td>{visitor.visit_reason === 'Other' ? visitor.other_reason : visitor.visit_reason}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="no-results">
                No visitors found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const VehiclesContent = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [approvingAll, setApprovingAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch('http://localhost:5000/api/admin/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      
      const data = await response.json();
      setVehicles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch(`http://localhost:5000/api/admin/vehicles/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  };

  const approveAll = async () => {
    try {
      setApprovingAll(true);
      const token = localStorage.getItem('staffToken');
      const response = await fetch('http://localhost:5000/api/admin/vehicles/approve-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to approve all');
      
      const data = await response.json();
      alert(data.message);
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    } finally {
      setApprovingAll(false);
    }
  };

  const handleDelete = (id) => {
    setVehicleToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch(`http://localhost:5000/api/admin/vehicles/${vehicleToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete vehicle');
      
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    } finally {
      setShowDeleteConfirm(false);
      setVehicleToDelete(null);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => 
    filter === 'All' || vehicle.status === filter
  );

  if (loading) return <div className="loading-spinner"></div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="vehicles-content">
      <h2>Vehicle Management</h2>
      
      <div className="vehicle-actions">
        <div className="vehicle-filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">All Vehicles</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        
        <button 
          className="approve-all-btn"
          onClick={approveAll}
          disabled={approvingAll}
        >
          {approvingAll ? 'Approving...' : 'Approve All Pending'}
        </button>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="confirmation-card">
          <div className="confirmation-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this vehicle?</p>
            <div className="confirmation-buttons">
              <button 
                className="confirm-btn"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Owner</th>
            <th>Number Plate</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map(vehicle => (
              <tr key={vehicle.id}>
                <td>{vehicle.id}</td>
                <td>{vehicle.owner_name || vehicle.email}</td>
                <td>{vehicle.numberplate}</td>
                <td>{vehicle.car_description || 'N/A'}</td>
                <td>
                  <select 
                    value={vehicle.status} 
                    onChange={(e) => updateStatus(vehicle.id, e.target.value)}
                    className={`status-select ${vehicle.status.toLowerCase()}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
                <td>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(vehicle.id)}
                  >
                    <FaTrash /> Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="no-results">
                No vehicles found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const GateAccessContent = () => {
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [manualPlate, setManualPlate] = useState('');
  const [manualAction, setManualAction] = useState('entry');
  const [showManualInput, setShowManualInput] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const retryTimeoutRef = useRef(null); // ✅ Now defined!

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (!videoRef.current) {
        console.warn("Video element not available, will retry...");
        retryTimeoutRef.current = setTimeout(startCamera, 100);
        return;
      }

      if (streamRef.current) stopCamera();

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error("Video element was removed during initialization");
      }

      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      const waitForVideoReady = () => {
        return new Promise((resolve, reject) => {
          const videoElement = videoRef.current;
          if (!videoElement) return reject(new Error("Video element not available"));

          const cleanUp = () => {
            try {
              videoElement.removeEventListener('canplay', onCanPlay);
              videoElement.removeEventListener('error', onError);
              clearTimeout(timeout);
            } catch (cleanupError) {
              console.warn("Cleanup error:", cleanupError);
            }
          };

          const onCanPlay = () => {
            cleanUp();
            resolve();
          };

          const onError = () => {
            cleanUp();
            reject(new Error("Video playback error"));
          };

          videoElement.addEventListener('canplay', onCanPlay);
          videoElement.addEventListener('error', onError);

          const timeout = setTimeout(() => {
            cleanUp();
            reject(new Error("Video initialization timeout"));
          }, 2000);
        });
      };

      await waitForVideoReady();
      setCameraActive(true);
      setCameraInitialized(true);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(err.message);
      setCameraActive(false);
      setCameraInitialized(false);
      stopCamera();

      if (err.name !== 'NotAllowedError' && err.name !== 'PermissionDeniedError') {
        retryTimeoutRef.current = setTimeout(startCamera, 1000);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    try {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }

      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
      }
    } catch (err) {
      console.error("Error in stopCamera:", err);
    }

    setCameraActive(false);
    setCameraInitialized(false);
  }, []);

  const captureAndProcess = async (action) => {
    if (!cameraActive || processing || !videoRef.current) return;

    try {
      setProcessing(true);

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);

      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      const formData = new FormData();
      formData.append('image', blob, 'plate.jpg');
      formData.append('action', action);

      const token = localStorage.getItem('staffToken');
      const response = await fetch('http://localhost:5000/api/process-plate', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Plate processing failed');
      }

      const data = await response.json();
      setLastResult(data);
    } catch (error) {
      console.error('Processing error:', error);
      setCameraError(error.message);
    } finally {
      stopCamera();
      setProcessing(false);
    }
  };

  const submitManualEntry = async () => {
    if (!manualPlate.trim()) {
      alert('Please enter a plate number.');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('staffToken');
      const response = await fetch('http://localhost:5000/api/manual-plate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plate_number: manualPlate.trim(),
          action: manualAction
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Manual entry failed');

      setLastResult(result);
      setShowManualInput(false);
      setManualPlate('');
    } catch (err) {
      console.error("Manual entry error:", err);
      setCameraError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="analytics-content">
      <h2><FaCamera /> Vehicle Access Control</h2>

      <div className="camera-section">
        {cameraError ? (
          <div className="error-message">
            <p>{cameraError}</p>
            <button
              onClick={startCamera}
              className="btn retry-btn"
              disabled={cameraError.includes('PermissionDenied')}
            >
              {cameraError.includes('PermissionDenied') ? 'Camera Blocked' : 'Retry Camera'}
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-feed"
              style={{ display: cameraActive ? 'block' : 'none' }}
            />
            {!cameraInitialized && (
              <div className="camera-placeholder">
                <p>{cameraActive ? 'Initializing...' : 'Camera Off'}</p>
              </div>
            )}
            <div className="camera-controls">
              {cameraActive ? (
                <button onClick={stopCamera} className="btn stop-btn">Stop Camera</button>
              ) : (
                <button onClick={startCamera} className="btn start-btn">Start Camera</button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="action-buttons">
        <button
          onClick={() => captureAndProcess('entry')}
          disabled={!cameraActive || processing}
          className={`btn entry-btn ${processing ? 'processing' : ''}`}
        >
          {processing ? 'Processing...' : 'Log Entry'}
        </button>
        <button
          onClick={() => captureAndProcess('exit')}
          disabled={!cameraActive || processing}
          className={`btn exit-btn ${processing ? 'processing' : ''}`}
        >
          {processing ? 'Processing...' : 'Log Exit'}
        </button>
      </div>

      <div className="manual-override">
        <button className="btn manual-btn" onClick={() => setShowManualInput(true)}>
          Manual Entry Override
        </button>
        {showManualInput && (
          <div className="manual-form">
            <h4>Manual Plate Entry</h4>
            <input
              type="text"
              value={manualPlate}
              onChange={(e) => setManualPlate(e.target.value)}
              placeholder="Enter plate number"
            />
            <select value={manualAction} onChange={(e) => setManualAction(e.target.value)}>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
            </select>
            <div className="manual-buttons">
              <button onClick={submitManualEntry} className="btn submit-manual" disabled={processing}>
                {processing ? 'Submitting...' : 'Submit'}
              </button>
              <button onClick={() => setShowManualInput(false)} className="btn cancel-manual">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {lastResult && (
        <div className={`result-card ${lastResult.status}`}>
          <div className="result-icon">
            {lastResult.status === 'granted' ? (
              <FaCheckCircle className="success" />
            ) : (
              <FaTimesCircle className="error" />
            )}
          </div>
          <div className="result-details">
            <h3>Last Action Result</h3>
            <p><strong>Plate:</strong> {lastResult.plate_number}</p>
            <p><strong>Status:</strong> <span className={`status-text ${lastResult.status}`}>{lastResult.status.toUpperCase()}</span></p>
            <p><strong>Time:</strong> {new Date(lastResult.timestamp).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};
const EntrylogsContent = () => {
  const [entryLogs, setEntryLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tableRef = useRef();

  useEffect(() => {
    fetchEntryLogs();
  }, []);

  useEffect(() => {
    const filtered = entryLogs.filter(log =>
      log.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entry_status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(filtered);
  }, [searchTerm, entryLogs]);

  const fetchEntryLogs = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch('http://localhost:5000/api/admin/entry-logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch entry logs');

      const data = await response.json();
      setEntryLogs(data);
      setFilteredLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContents = tableRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Entry Logs</title>');
    printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #000; padding: 8px; text-align: center; } th { background-color: #eee; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h3>Entry Logs</h3>');
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <div className="loading-spinner">Loading entry logs...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="settings-content">
      <div className="entry-logs-section">
        <div className="logs-header">
          <h3>Entry Logs</h3>
          <button onClick={handlePrint} className="print-button">
            <FaPrint style={{ marginRight: '5px' }} />
            Print
          </button>
        </div>

        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by plate, user, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div ref={tableRef}>
          <table className="entry-logs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Plate Number</th>
                <th>User</th>
                <th>Entry Time</th>
                <th>Exit Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{log.plate_number}</td>
                    <td>{log.user_name || 'Visitor'}</td>
                    <td>{log.entry_time ? new Date(log.entry_time).toLocaleString() : 'N/A'}</td>
                    <td>{log.exit_time ? new Date(log.exit_time).toLocaleString() : 'Still inside'}</td>
                    <td className={`status-${(log.entry_status || 'unknown').toLowerCase()}`}>
                      {log.entry_status || 'Unknown'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-results">
                    No matching entry logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};






export default AdminDashboard;