import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiMapPin } from 'react-icons/fi';

export default function TeamAlerts() {
  const [activeAlert, setActiveAlert] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    // Poll for alerts every 5 seconds
    fetchTeamAlert();
    const interval = setInterval(fetchTeamAlert, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTeamAlert = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/Maintenance/tickets');
      // For this demo, we assume the Maintenance Team is "Team A" (TeamId = 1)
      const myTickets = response.data.filter(t => t.teamId === 1 && (t.status === 'Assigned' || t.status === 'En Route' || t.status === 'Repairing'));
      if (myTickets.length > 0) {
        // Just show the most recent assigned ticket
        setActiveAlert(myTickets[0]);
      } else {
        // No real tickets assigned, let's use a dummy one if we want to show something, or just null
        setActiveAlert(null);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    }
  };

  const dummyAlert = {
    ticketId: 'SG-2026-1024',
    faultDescription: 'Transformer Overheating',
    location: 'Nagercoil Substation',
    severity: 'High',
    latitude: 8.1833,
    longitude: 77.4119
  };

  const alertToDisplay = activeAlert || dummyAlert;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Team Alerts</h1>
        <p>Live alert feed for your maintenance team</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
          border: '1px solid var(--accent-red)',
          borderRadius: '16px',
          padding: '30px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <div className="pulse-dot" style={{ background: 'var(--accent-red)' }} />
            <h2 style={{ margin: 0, color: 'var(--accent-red)', fontSize: '24px' }}>SMART GRID ALERT</h2>
          </div>

          <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Fault Type</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{alertToDisplay.faultDescription || alertToDisplay.fault?.description}</div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Location</div>
              <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{alertToDisplay.location || (alertToDisplay.fault?.nodeId === 1 ? 'Nagercoil Substation' : 'Unknown Area')}</div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Severity</div>
              <div style={{ fontSize: '16px', color: 'var(--accent-red)', fontWeight: 'bold' }}>{alertToDisplay.severity || alertToDisplay.fault?.severity || 'High'}</div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Ticket ID</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{alertToDisplay.ticketId}</div>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '15px', fontSize: '16px', display: 'flex', justifyContent: 'center', gap: '10px' }}
            onClick={() => setShowMap(true)}
          >
            <FiMapPin size={20} /> Navigate to Location
          </button>
        </div>
      </div>

      {showMap && (
        <div className="modal-overlay" onClick={() => setShowMap(false)}>
          <div className="modal" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Navigation Map</h2>
              <button className="close-btn" onClick={() => setShowMap(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '0', height: '400px', background: '#e5e7eb', borderRadius: '0 0 12px 12px', overflow: 'hidden', position: 'relative' }}>
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight="0" 
                marginWidth="0" 
                src={`https://maps.google.com/maps?q=${alertToDisplay.latitude || 8.1833},${alertToDisplay.longitude || 77.4119}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
