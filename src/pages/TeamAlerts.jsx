import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function TeamAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [activeMapAlert, setActiveMapAlert] = useState(null);
  const { user, logout } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', role: 'Field Technician', phoneNumber: '', teamId: 1 });
  
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [proofPhoto, setProofPhoto] = useState(null);

  useEffect(() => {
    fetchTeamAlerts();
    const interval = setInterval(fetchTeamAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentUserId = user?.id || user?.Id;
    if (currentUserId) {
      axios.get(`/Maintenance/profile/${currentUserId}`)
        .then(res => setProfile(res.data))
        .catch(err => {
          if (err.response?.status === 404) setShowProfileModal(true);
        });
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const currentUserId = user?.id || user?.Id;
      const res = await axios.post('/Maintenance/profile', { ...profileForm, userId: currentUserId });
      setProfile(res.data);
      setShowProfileModal(false);
      toast.success('Profile setup complete!');
    } catch (err) {
      console.error("Profile save error:", err.response?.data || err.message);
      toast.error('Failed to setup profile: ' + (err.response?.data?.message || err.response?.data || 'Unknown error'));
    }
  };

  const handleResolveJob = async (e) => {
    e.preventDefault();
    if (!proofPhoto) return toast.error('Please select a photo proof.');
    
    const formData = new FormData();
    formData.append('proofPhoto', proofPhoto);
    const rawTicketId = activeTicket.ticketId.toString().split('-').pop();
    
    try {
      await axios.post(`/Maintenance/ticket/${rawTicketId}/upload-proof`, formData);
      toast.success('Job marked as completed pending verification!');
      setShowResolveModal(false);
      setProofPhoto(null);
      fetchTeamAlerts();
    } catch (err) {
      toast.error('Failed to upload proof.');
    }
  };

  const handleSimulateAlert = async () => {
    try {
      await axios.post('/Maintenance/simulate-alert');
      toast.success('Simulated fault triggered!');
      fetchTeamAlerts();
    } catch (err) {
      toast.error('Failed to simulate alert.');
    }
  };

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
    const engineerName = profile?.name || "Maintenance Engineer";

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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={handleSimulateAlert} className="btn btn-warning" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-lightning-charge-fill"></i> Simulate Alert
          </button>
          <button onClick={() => {
            if (profile) setProfileForm({ name: profile.name, role: profile.role, phoneNumber: profile.phoneNumber, teamId: profile.teamId });
            setShowProfileModal(true);
          }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-person-circle"></i> My Profile
          </button>
          <button onClick={logout} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
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

              {alert.status === 'En Route' && (
                <button 
                  className="btn btn-warning btn-lg" 
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}
                  onClick={() => {
                    setActiveTicket(alert);
                    setShowResolveModal(true);
                  }}
                >
                  <i className="bi bi-camera-fill"></i> Resolve & Upload Proof
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

      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{profile ? "My Profile" : "Setup Your Profile"}</h2>
              {profile && <button className="close-btn" onClick={() => setShowProfileModal(false)}><i className="bi bi-x-lg"></i></button>}
            </div>
            <div className="modal-body">
              {!profile && <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Please complete your profile to continue receiving alerts.</p>}
              <form onSubmit={handleSaveProfile}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Full Name</label>
                  <input type="text" className="form-control" required value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} placeholder="e.g. John Doe" />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Phone Number</label>
                  <input type="text" className="form-control" required value={profileForm.phoneNumber} onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})} placeholder="+1 234 567 890" />
                </div>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Role</label>
                  <select className="form-control" value={profileForm.role} onChange={e => setProfileForm({...profileForm, role: e.target.value})}>
                    <option>Field Technician</option>
                    <option>Senior Engineer</option>
                    <option>Lineman</option>
                    <option>Dispatcher</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Profile</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && activeTicket && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Resolve Ticket {activeTicket.ticketId}</h2>
              <button className="close-btn" onClick={() => setShowResolveModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Upload a photo of the completed repair to submit for verification.</p>
              <form onSubmit={handleResolveJob}>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Proof Photo</label>
                  <input type="file" accept="image/*" capture="environment" className="form-control" onChange={e => setProofPhoto(e.target.files[0])} required />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowResolveModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success">Submit for Verification</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

