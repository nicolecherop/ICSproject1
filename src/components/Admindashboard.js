import React, { useState, useEffect,useRef  } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { 
  FaHome, 
  FaUsers, 
  FaShoppingCart, 
  FaChartBar, 
  FaCog,
  FaUserCircle,
  FaEdit,
  FaTrash,
  FaSearch,
  FaPlus,
  FaSignOutAlt,
  FaSync
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
      case 'analytics': return <AnalyticsContent />;
      case 'settings': return <SettingsContent />;
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
              <FaShoppingCart className="icon" />
              <span>Vehicles</span>
            </li>
            <li 
              className={activeTab === 'analytics' ? 'active' : ''}
              onClick={() => setActiveTab('analytics')}
            >
              <FaChartBar className="icon" />
              <span>Camera access</span>
            </li>
            <li 
              className={activeTab === 'settings' ? 'active' : ''}
              onClick={() => setActiveTab('settings')}
            >
              <FaCog className="icon" />
              <span>Gate Access</span>
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

const AnalyticsContent = () => {
  const [activeCamera, setActiveCamera] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null); // to store the MediaStream

  const openCamera = async (label) => {
    setActiveCamera(label);

    // Stop any existing stream before starting a new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
    }
  };

  const turnOffCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActiveCamera(null);
  };

  return (
    <div className="analytics-content">
      <h2>Camera Access</h2>
      <div className="charts-container">
        <div className="chart">
          <h3>IN</h3>
          <button onClick={() => openCamera('IN')}>Open IN Camera</button>
        </div>

        <div className="chart">
          <h3>OUT</h3>
          <button onClick={() => openCamera('OUT')}>Open OUT Camera</button>
        </div>
      </div>

      {activeCamera && (
        <div className="camera-preview">
          <video ref={videoRef} width="360" height="260" autoPlay muted />
          <button onClick={turnOffCamera} style={{ marginTop: '10px' }}>
            Turn Off Camera
          </button>
        </div>
      )}
    </div>
  );
};


const SettingsContent = () => {
  const [entryLogs, setEntryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEntryLogs();
  }, []);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading entry logs...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="settings-content">
      <h2>Gate Access Settings</h2>
      
      <div className="settings-form">
        <div className="form-group">
          <label>Gate Open Time</label>
          <input type="time" defaultValue="06:00" />
        </div>
        <div className="form-group">
          <label>Gate Close Time</label>
          <input type="time" defaultValue="22:00" />
        </div>
        <div className="form-group">
          <label>Access Mode</label>
          <select>
            <option>Automatic</option>
            <option>Manual</option>
            <option>Scheduled</option>
          </select>
        </div>
        <button className="save-btn">Save Settings</button>
      </div>

      <div className="entry-logs-section">
        <h3>Entry Logs</h3>
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search entry logs..." 
          />
        </div>
        
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
            {entryLogs.length > 0 ? (
              entryLogs.map(log => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.plate_number}</td>
                  <td>{log.user_name || 'Visitor'}</td>
                  <td>{new Date(log.entry_time).toLocaleString()}</td>
                  <td>{log.exit_time ? new Date(log.exit_time).toLocaleString() : 'Still inside'}</td>
                  <td className={`status-${log.status.toLowerCase()}`}>
                    {log.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
                  No entry logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


export default AdminDashboard;