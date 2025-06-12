import React, { useState } from 'react';
import './AdminDashboard.css';
import { 
  FaHome, 
  FaUsers, 
  FaShoppingCart, 
  FaChartBar, 
  FaCog,
  FaBars,
  FaChevronLeft,
  FaUserCircle,
  FaEdit,
  FaTrash,
  FaSearch,
  FaPlus
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardContent />;
      case 'users': return <UsersContent />;
      case 'orders': return <OrdersContent />;
      case 'analytics': return <AnalyticsContent />;
      case 'settings': return <SettingsContent />;
      default: return <DashboardContent />;
    }
  };

  return (
    <div className={`admin-dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          {sidebarOpen ? (
            <>
              <h2>Admin Panel</h2>
              <FaChevronLeft className="toggle-btn" onClick={() => setSidebarOpen(false)} />
            </>
          ) : (
            <FaBars className="toggle-btn" onClick={() => setSidebarOpen(true)} />
          )}
        </div>

        <nav>
          <ul>
            <li 
              className={activeTab === 'dashboard' ? 'active' : ''}
              onClick={() => setActiveTab('dashboard')}
            >
              <FaHome className="icon" />
              {sidebarOpen && <span>Dashboard</span>}
            </li>
            <li 
              className={activeTab === 'users' ? 'active' : ''}
              onClick={() => setActiveTab('users')}
            >
              <FaUsers className="icon" />
              {sidebarOpen && <span>Users</span>}
            </li>
            <li 
              className={activeTab === 'orders' ? 'active' : ''}
              onClick={() => setActiveTab('orders')}
            >
              <FaShoppingCart className="icon" />
              {sidebarOpen && <span>Orders</span>}
            </li>
            <li 
              className={activeTab === 'analytics' ? 'active' : ''}
              onClick={() => setActiveTab('analytics')}
            >
              <FaChartBar className="icon" />
              {sidebarOpen && <span>Analytics</span>}
            </li>
            <li 
              className={activeTab === 'settings' ? 'active' : ''}
              onClick={() => setActiveTab('settings')}
            >
              <FaCog className="icon" />
              {sidebarOpen && <span>Settings</span>}
            </li>
          </ul>
        </nav>
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

// Content Components
const DashboardContent = () => (
  <div className="dashboard-content">
    <div className="stats-container">
      <div className="stat-card">
        <h3>Total Users</h3>
        <p>1,245</p>
      </div>
      <div className="stat-card">
        <h3>New Orders</h3>
        <p>56</p>
      </div>
      <div className="stat-card">
        <h3>Revenue</h3>
        <p>$12,345</p>
      </div>
    </div>
    <div className="recent-activity">
      <h2>Recent Activity</h2>
      <ul>
        <li>New user registered - John Doe</li>
        <li>Order #1234 completed</li>
        <li>System updated to v2.3</li>
      </ul>
    </div>
  </div>
);

const UsersContent = () => (
  <div className="users-content">
    <h2>User Management</h2>
    <div className="search-bar">
      <FaSearch className="search-icon" />
      <input type="text" placeholder="Search users..." />
      <button><FaPlus /> Add New User</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>John Doe</td>
          <td>john@example.com</td>
          <td>Admin</td>
          <td>
            <button className="edit-btn"><FaEdit /> Edit</button>
            <button className="delete-btn"><FaTrash /> Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

const OrdersContent = () => (
  <div className="orders-content">
    <h2>Order Management</h2>
    <div className="order-filters">
      <select>
        <option>All Orders</option>
        <option>Pending</option>
        <option>Completed</option>
        <option>Cancelled</option>
      </select>
    </div>
    <div className="orders-list">
      <p>Order management content goes here</p>
    </div>
  </div>
);

const AnalyticsContent = () => (
  <div className="analytics-content">
    <h2>Analytics Dashboard</h2>
    <div className="charts-container">
      <div className="chart">
        <h3>User Growth</h3>
        <div className="chart-placeholder">Chart will appear here</div>
      </div>
      <div className="chart">
        <h3>Sales Performance</h3>
        <div className="chart-placeholder">Chart will appear here</div>
      </div>
    </div>
  </div>
);

const SettingsContent = () => (
  <div className="settings-content">
    <h2>System Settings</h2>
    <form>
      <div className="form-group">
        <label>Site Title</label>
        <input type="text" defaultValue="Admin Dashboard" />
      </div>
      <div className="form-group">
        <label>Timezone</label>
        <select defaultValue="UTC">
          <option>UTC</option>
          <option>EST</option>
          <option>PST</option>
        </select>
      </div>
      <button type="submit" className="save-btn">Save Settings</button>
    </form>
  </div>
);

export default AdminDashboard;