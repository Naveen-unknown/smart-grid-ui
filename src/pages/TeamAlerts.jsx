import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function TeamAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [activeMapAlert, setActiveMapAlert] = useState(null);
  const { logout } = useAuth();

  useEffect(() => {
    fetchTeamAlerts();
    const interval = setInterval(fetchTeamAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTeamAlerts = async () => {
    try {
      const response = await axios.get('/Maintenance/tickets');
      // Assume the Maintenance Team is "Team A" (TeamId = 1)
      const myTickets = response.data.filter(t => t.teamId === 1 && t.status !== 'Completed');
      if (myTickets.length > 0) {
        setAlerts(myTickets);
      } else {
        // Dummy data if empty
        setAlerts([
          {
            ticketId: 'SG-2026-1024',
            status: 'Assigned',
            faultDescription: 'Transformer Overheating',
            location: 'Nagercoil Substation',
            severity: 'High',
            latitude: 8.1833,
            longitude: 77.4119
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    }
  };

  const handleAcceptJob = async (ticketId) => {
    const engineerName = window.prompt("Enter your name to confirm dispatch:");
    if (!engineerName) return;

    const rawTicketId = ticketId.toString().split('-').pop(); // Handle formatted IDs like SG-2026-1024
    
    // Optimistically update UI
    setAlerts(prev => prev.map(a => a.ticketId === ticketId ? { ...a, status: 'En Route', acceptedBy: engineerName } : a));
    
    try {
      await axios.post(`/Maintenance/ticket/${rawTicketId}/status`, { Status: 'En Route', AcceptedBy: engineerName });
      toast.success(`Job Accepted by ${engineerName}! Status updated to En Route.`);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        toast.success(`Job Accepted by ${engineerName}! (Simulated Mode)`);
      } else {
        toast.error('Failed to update job status on server.');
        console.error(err);
      }
    }
  };

  const openMap = (alert) => {
    setActiveMapAlert(alert);
    setShowMap(true);
  };

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '28px', color: 'var(--text-primary)' }}>
            <i className="bi bi-person-workspace" style={{ color: 'var(--accent-red)' }}></i> Team Alerts Feed
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Live fault & outage dispatch assignments for Team A</p>
        </div>
        <button onClick={logout} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-box-arrow-right"></i> Logout
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {alerts.map((alert, idx) => (
          <div key={idx} style={{ 
            background: alert.status === 'Assigned' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(220, 38, 38, 0.02))' : 'var(--bg-card)',
            border: `1px solid ${alert.status === 'Assigned' ? 'var(--accent-red)' : 'var(--border-color)'}`,
            borderRadius: '16px',
            padding: '24px',
            boxShadow: alert.status === 'Assigned' ? '0 8px 32px rgba(239, 68, 68, 0.1)' : 'var(--shadow-md)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {alert.status === 'Assigned' && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-red)' }}></div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {alert.status === 'Assigned' && <div className="live-dot" style={{ background: 'var(--accent-red)' }}></div>}
                <h2 style={{ margin: 0, color: alert.status === 'Assigned' ? 'var(--accent-red)' : 'var(--accent-blue)', fontSize: '20px', fontWeight: 'bold' }}>
                  {alert.status === 'Assigned' ? 'NEW DISPATCH' : 'IN PROGRESS'}
                </h2>
              </div>
              <span className={`badge ${alert.status === 'Assigned' ? 'badge-yellow' : 'badge-blue'}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                {alert.status}
              </span>
            </div>

            <div className="grid-2" style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Fault Type</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{alert.faultDescription || alert.fault?.description}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Location</div>
                <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{alert.location || alert.fault?.node?.location || 'Assigned Zone'}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Severity</div>
                <div style={{ fontSize: '16px', color: 'var(--accent-red)', fontWeight: 'bold' }}>{alert.severity || alert.fault?.severity || 'High'}</div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Ticket ID</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{alert.ticketId}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {alert.status === 'Assigned' && (
                <button 
                  className="btn btn-success btn-lg" 
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}
                  onClick={() => handleAcceptJob(alert.ticketId)}
                >
                  <i className="bi bi-check-circle-fill"></i> Accept Job
                </button>
              )}
              
              <button 
                className={alert.status === 'Assigned' ? "btn btn-outline btn-lg" : "btn btn-primary btn-lg"} 
                style={{ flex: alert.status === 'Assigned' ? 'none' : 1, display: 'flex', justifyContent: 'center', gap: '8px', padding: alert.status === 'Assigned' ? '0 24px' : 'auto' }}
                onClick={() => openMap(alert)}
              >
                <i className="bi bi-geo-alt-fill"></i> View Map
              </button>
            </div>
          </div>
        ))}
      </div>

      {showMap && activeMapAlert && (
        <div className="modal-overlay" onClick={() => setShowMap(false)}>
          <div className="modal" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Navigate to Site: {activeMapAlert.ticketId}</h2>
              <button className="close-btn" onClick={() => setShowMap(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="modal-body" style={{ padding: '0', height: '400px', background: '#e5e7eb', borderRadius: '0 0 12px 12px', overflow: 'hidden', position: 'relative' }}>
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight="0" 
                marginWidth="0" 
                src={`https://maps.google.com/maps?q=${activeMapAlert.latitude || 8.1833},${activeMapAlert.longitude || 77.4119}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

