import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../api/services';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = user?.role === 'Maintenance Team' ? [
    { to: '/', icon: '🔔', label: 'Team Alerts', end: true }
  ] : [
    { to: '/', icon: '📊', label: 'Dashboard', end: true },
    { to: '/energy', icon: '⚡', label: 'Energy Readings' },
    { to: '/nodes', icon: '🔌', label: 'Grid Nodes' },
    { to: '/faults', icon: '🔧', label: 'Fault Management' },
    { to: '/outages', icon: '🚨', label: 'Outage Management' },
    { to: '/maintenance', icon: '👷', label: 'Maintenance' },
    { to: '/notifications', icon: '🔔', label: 'Alert Center' },
    { to: '/ai-insights', icon: '🤖', label: 'AI Insights' },
    { to: '/ai-chat', icon: '💬', label: 'AI Chat Assistant' },
    { to: '/report', icon: '📋', label: 'Reports' },
  ];

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll every 10 seconds for new alerts
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      if (response.data?.data) {
        const unread = response.data.data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      // Handle silently
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.jpg" alt="Logo" style={{ width: '42px', height: '42px', borderRadius: '12px', marginBottom: '10px', objectFit: 'cover', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }} />
        <h1>Smart Grid</h1>
        <span>Monitoring System</span>
      </div>

      <nav className="sidebar-nav">
        {user?.role === 'Maintenance Team' ? (
          <>
            <div className="nav-section-label">Team Portal</div>
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        ) : (
          <>
            <div className="nav-section-label">Main Menu</div>
            {navItems.slice(0, 2).map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}

            <div className="nav-section-label" style={{ marginTop: '8px' }}>Grid Management</div>
            {navItems.slice(2, 7).map(item => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.to === '/notifications' && unreadCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>{unreadCount}</span>
                )}
              </NavLink>
            ))}

            <div className="nav-section-label" style={{ marginTop: '8px' }}>Analytics</div>
            {navItems.slice(7).map(item => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
          <div className="user-info">
            <div className="name">{user?.username}</div>
            <div className="role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">↩</button>
        </div>
      </div>
    </aside>
  );
}
