import { useState, useEffect } from 'react';
import { notificationsAPI } from '../api/services';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      if (response.data?.data) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const getBadgeClass = (type) => {
    switch(type) {
      case 'Critical': return 'badge-critical';
      case 'Warning': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔔 Alert Center</h1>
        <p>Monitor system alerts and SMS notifications sent to Electricity Officers.</p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No notifications found.
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: notification.isRead ? 'transparent' : 'rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: notification.isRead ? 'normal' : 'bold' }}>
                      {notification.title}
                    </span>
                    <span className={`status-badge ${getBadgeClass(notification.type)}`}>
                      {notification.type}
                    </span>
                    {!notification.isRead && (
                      <span style={{ background: 'var(--primary-color)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>NEW</span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {notification.message}
                  </p>
                  <small style={{ color: 'var(--text-muted)' }}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </small>
                </div>
                {!notification.isRead && (
                  <button 
                    className="btn btn-outline" 
                    onClick={() => handleMarkAsRead(notification.id)}
                    style={{ marginLeft: '16px' }}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .badge-critical { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .badge-warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .badge-info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      `}</style>
    </div>
  );
};

export default Notifications;
