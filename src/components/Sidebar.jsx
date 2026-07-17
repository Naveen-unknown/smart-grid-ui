import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../api/services';
import toast from 'react-hot-toast';

export default function Sidebar({ theme, toggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = user?.role === 'Maintenance Team' ? [
    { to: '/', icon: <i className="bi bi-bell-fill" style={{ color: 'var(--accent-yellow)' }}></i>, label: 'Team Alerts', end: true }
  ] : [
    { to: '/', icon: <i className="bi bi-grid-1x2-fill" style={{ color: 'var(--accent-blue)' }}></i>, label: 'Dashboard', end: true },
    { to: '/energy', icon: <i className="bi bi-lightning-charge-fill" style={{ color: 'var(--accent-yellow)' }}></i>, label: 'Energy Readings' },
    { to: '/nodes', icon: <i className="bi bi-hdd-network-fill" style={{ color: 'var(--accent-green)' }}></i>, label: 'Grid Nodes' },
    { to: '/faults', icon: <i className="bi bi-wrench-adjustable" style={{ color: 'var(--accent-orange)' }}></i>, label: 'Fault Management' },
    { to: '/outages', icon: <i className="bi bi-exclamation-octagon-fill" style={{ color: 'var(--accent-red)' }}></i>, label: 'Outage Management' },
    { to: '/maintenance', icon: <i className="bi bi-people-fill" style={{ color: 'var(--accent-purple)' }}></i>, label: 'Manage Teams' },
    { to: '/notifications', icon: <i className="bi bi-bell-fill" style={{ color: '#ec4899' }}></i>, label: 'Alert Center' },
    { to: '/ai-insights', icon: <i className="bi bi-robot" style={{ color: 'var(--accent-cyan)' }}></i>, label: 'AI Insights' },
    { to: '/ai-chat', icon: <i className="bi bi-chat-dots-fill" style={{ color: 'var(--accent-green)' }}></i>, label: 'AI Chat Assistant' },
    { to: '/report', icon: <i className="bi bi-clipboard2-data-fill" style={{ color: 'var(--text-secondary)' }}></i>, label: 'Reports' },
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
      <div className="sidebar-logo" style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-lightning-charge-fill" style={{ color: 'var(--accent-blue)' }}></i> Smart Grid
        </h2>
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
          <button className="logout-btn" onClick={toggleTheme} title="Toggle Theme" style={{ marginRight: '4px' }}>
            {theme === 'light' ? <i className="bi bi-moon-fill"></i> : <i className="bi bi-sun-fill"></i>}
          </button>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
