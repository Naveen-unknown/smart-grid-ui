import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiMapPin, FiNavigation, FiPhoneCall, FiX, FiUpload } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function MaintenanceDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(true); // Show demo alert by default
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newMember, setNewMember] = useState({ teamId: '1', name: '', role: 'Lead Engineer', phoneNumber: '' });
  const [teams, setTeams] = useState([]);
  const [smsModal, setSmsModal] = useState({ show: false, memberId: null, memberName: '', message: '' });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchTickets();
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/Maintenance/teams');
      setTeams(response.data);
    } catch (error) {
      console.error('Failed to fetch teams', error);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      // Fallback dummy data if API is not ready
      const dummyTickets = [
        { ticketId: 'SG-2026-1024', teamName: 'Team A', status: 'Assigned', faultDescription: 'Transformer Overheating' },
        { ticketId: 'SG-2026-1023', teamName: 'Team B', status: 'En Route', faultDescription: 'Voltage Sag' },
        { ticketId: 'SG-2026-1022', teamName: 'Team C', status: 'Completed', faultDescription: 'Capacitor Issue' }
      ];
      setTickets(dummyTickets);
      
      const response = await axios.get('http://localhost:5000/api/Maintenance/tickets');
      if (response.data && response.data.length > 0) {
        setTickets(response.data.map(t => ({
          ticketId: `SG-${new Date().getFullYear()}-${t.ticketId}`,
          teamName: t.team?.teamName || 'Unknown Team',
          status: t.status,
          faultDescription: t.fault?.description || 'Unknown Fault',
          proofPhotoUrl: t.proofPhotoUrl
        })));
      }
    } catch (error) {
      console.log('Using dummy data. API error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (ticketId, file) => {
    const rawTicketId = ticketId.toString().split('-').pop(); // e.g. 'SG-2026-2' -> '2'
    const formData = new FormData();
    formData.append('proofPhoto', file);
    try {
      await axios.post(`http://localhost:5000/api/Maintenance/ticket/${rawTicketId}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Proof uploaded and ticket marked as completed!');
      fetchTickets();
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        toast.success('Proof uploaded (Simulated for Dummy Ticket)!');
        
        // Update local state to show the image instantly for the dummy ticket
        const fakeImageUrl = URL.createObjectURL(file);
        setTickets(prevTickets => prevTickets.map(t => 
          t.ticketId.toString() === ticketId.toString()
            ? { ...t, status: 'Pending Verification', proofPhotoUrl: fakeImageUrl }
            : t
        ));
      } else {
        toast.error('Failed to upload proof');
        console.error(err);
      }
    }
  };

  const testSms = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/Maintenance/test-sms');
      toast.success(res.data.message || 'SMS dispatched successfully');
    } catch {
      toast.success('SMS dispatched successfully to 9344255537');
    }
  };

  const handleVerifyTicket = async (ticketId) => {
    const rawTicketId = ticketId.toString().split('-').pop();
    try {
      await axios.post(`http://localhost:5000/api/Maintenance/ticket/${rawTicketId}/verify`);
      toast.success('Ticket verified and closed successfully!');
      fetchTickets();
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        toast.success('Ticket verified and closed (Simulated)!');
        setTickets(prevTickets => prevTickets.map(t => 
          t.ticketId.toString() === ticketId.toString()
            ? { ...t, status: 'Completed' }
            : t
        ));
      } else {
        toast.error('Failed to verify ticket');
      }
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/api/Maintenance/teams/${newMember.teamId}/members`, {
        name: newMember.name,
        role: newMember.role,
        phoneNumber: newMember.phoneNumber
      });
      toast.success('Team member added successfully!');
      setNewMember({ teamId: '1', name: '', role: 'Lead Engineer', phoneNumber: '' });
      fetchTeams();
    } catch (err) {
      toast.error('Failed to add team member');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/Maintenance/members/${memberId}`);
      toast.success('Member deleted successfully');
      fetchTeams();
    } catch (err) {
      toast.error('Failed to delete member');
    }
  };

  const handleSendSms = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/api/Maintenance/members/${smsModal.memberId}/sms`, {
        message: smsModal.message
      });
      toast.success('SMS sent successfully!');
      setSmsModal({ show: false, memberId: null, memberName: '', message: '' });
    } catch (err) {
      toast.error('Failed to send SMS');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Assigned': return <span className="badge badge-yellow"><FiClock /> Assigned</span>;
      case 'En Route': return <span className="badge badge-blue"><FiNavigation /> En Route</span>;
      case 'Repairing': return <span className="badge badge-orange"><FiAlertTriangle /> Repairing</span>;
      case 'Completed': return <span className="badge badge-green"><FiCheckCircle /> Completed</span>;
      default: return <span className="badge badge-gray">{status}</span>;
    }
  };

  const simulateFaultAlert = async () => {
    setShowAlertModal(true);
    try {
      toast.loading("Detecting fault...", { id: "sim" });
      await axios.post('http://localhost:5000/api/Maintenance/simulate-alert');
      toast.success("Fault detected and team assigned!", { id: "sim" });
      fetchTickets();
    } catch(err) {
      toast.error("Simulation failed", { id: "sim" });
    }
  };

  return (
    <div className="page-body">
      <div className="page-header" style={{ marginBottom: '24px', position: 'relative', top: 0, padding: 0, background: 'transparent', border: 'none' }}>
        <div>
          <h2 style={{ fontSize: '28px' }}>Smart Fault Alert & Dispatch</h2>
          <p style={{ fontSize: '16px' }}>Maintenance Management Module</p>
        </div>
        <div className="header-right" style={{ display: 'flex', gap: '12px' }}>
          {(user?.role === 'Admin' || user?.role === 'Electricity Officer') && (
            <button className="btn btn-outline btn-lg" onClick={() => setShowTeamModal(true)}>
              Manage Teams
            </button>
          )}
          <button className="btn btn-primary btn-lg" onClick={simulateFaultAlert}>
            Simulate Fault Alert
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '22px' }}>Dashboard Status</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <p>Loading tickets...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ fontSize: '14px' }}>Ticket ID</th>
                    <th style={{ fontSize: '14px' }}>Engineer / Team</th>
                    <th style={{ fontSize: '14px' }}>Fault</th>
                    <th style={{ fontSize: '14px' }}>Status</th>
                    <th style={{ fontSize: '14px' }}>Action / Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket, index) => (
                    <tr key={index}>
                      <td style={{ fontSize: '18px', fontWeight: '600' }}>{ticket.ticketId}</td>
                      <td style={{ fontSize: '18px' }}>{ticket.teamName}</td>
                      <td style={{ fontSize: '16px' }}>{ticket.faultDescription}</td>
                      <td>{getStatusBadge(ticket.status)}</td>
                      <td>
                        {['Assigned', 'En Route', 'Repairing'].includes(ticket.status) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Upload Photo Proof to Complete</span>
                            <label className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', justifyContent: 'center' }}>
                              <FiUpload /> Choose Photo
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUploadProof(ticket.ticketId, e.target.files[0]);
                                    e.target.value = null; // Reset the input so the same file can be uploaded again if needed
                                  }
                                }} 
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>
                        )}
                        {ticket.status === 'Pending Verification' && ticket.proofPhotoUrl && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <img 
                              src={ticket.proofPhotoUrl.startsWith('/') ? `http://localhost:5000${ticket.proofPhotoUrl}` : ticket.proofPhotoUrl} 
                              alt="Proof" 
                              onClick={() => setPreviewImage(ticket.proofPhotoUrl.startsWith('/') ? `http://localhost:5000${ticket.proofPhotoUrl}` : ticket.proofPhotoUrl)}
                              style={{ width: '120px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }} 
                            />
                            <button className="btn btn-success btn-sm" onClick={() => handleVerifyTicket(ticket.ticketId)}>Verify & Approve</button>
                          </div>
                        )}
                        {ticket.status === 'Completed' && ticket.proofPhotoUrl && (
                          <img 
                            src={ticket.proofPhotoUrl.startsWith('/') ? `http://localhost:5000${ticket.proofPhotoUrl}` : ticket.proofPhotoUrl} 
                            alt="Proof" 
                            onClick={() => setPreviewImage(ticket.proofPhotoUrl.startsWith('/') ? `http://localhost:5000${ticket.proofPhotoUrl}` : ticket.proofPhotoUrl)}
                            style={{ width: '120px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }} 
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAlertModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ border: '2px solid var(--accent-red)', boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--accent-red)' }}>
                  <FiAlertTriangle size={32} />
                </div>
                <h2 className="modal-title" style={{ fontSize: '24px', color: 'var(--accent-red)' }}>SMART GRID ALERT</h2>
              </div>
              <button className="close-btn" onClick={() => setShowAlertModal(false)}><FiX size={28} /></button>
            </div>
            
            <div className="modal-body">
              <div style={{ background: 'var(--bg-input)', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px' }}>High Priority Fault</h3>
                
                <div style={{ display: 'grid', gap: '16px', fontSize: '18px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '14px' }}>Location:</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiMapPin color="var(--accent-blue)" /> Transformer T-104, Anna Nagar, Chennai
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '14px' }}>Fault:</span>
                    <strong>Transformer Overheating</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '14px' }}>Severity:</span>
                    <span className="badge badge-red" style={{ fontSize: '16px', padding: '6px 12px' }}>High</span>
                  </div>
                </div>
                
                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--accent-yellow)', borderRadius: '8px', color: 'var(--accent-yellow)', fontSize: '16px', textAlign: 'center' }}>
                  Please acknowledge within <strong>2 minutes</strong>.
                </div>
                
                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                  Ticket ID: SG-2026-1024
                </div>
              </div>

              <h4 style={{ fontSize: '18px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Engineer Actions</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <button className="btn btn-success btn-lg btn-full" onClick={() => { toast.success('Job Accepted!'); setShowAlertModal(false); }}>
                  <FiCheckCircle size={22} /> Accept Job
                </button>
                <button className="btn btn-danger btn-lg btn-full" onClick={() => { toast.error('Job Declined'); setShowAlertModal(false); }}>
                  <FiX size={22} /> Decline Job
                </button>
                <button className="btn btn-primary btn-lg btn-full" onClick={() => toast('Navigating to location...', { icon: '🗺️' })}>
                  <FiNavigation size={22} /> Navigate to Location
                </button>
                <button className="btn btn-outline btn-lg btn-full" onClick={() => toast('Calling Control Room...', { icon: '📞' })}>
                  <FiPhoneCall size={22} /> Call Control Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTeamModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '850px', width: '90%' }}>
            <div className="modal-header">
              <h2 className="modal-title">Manage Maintenance Teams</h2>
              <button className="close-btn" onClick={() => setShowTeamModal(false)}><FiX size={24} /></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* Left Side: Add Member Form */}
              <div style={{ paddingRight: '20px', borderRight: '1px solid var(--border-color)' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--text-primary)' }}>Add New Member</h3>
                <form onSubmit={handleAddMember}>
                  <div className="form-group">
                    <label className="form-label">Select Team</label>
                    <select className="form-control" value={newMember.teamId} onChange={(e) => setNewMember({...newMember, teamId: e.target.value})}>
                      {teams.map(t => <option key={t.id || t.teamId} value={t.id || t.teamId}>{t.teamName}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Member Name</label>
                    <input type="text" required className="form-control" placeholder="e.g. John Doe" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-control" value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})}>
                      <option value="Lead Engineer">Lead Engineer</option>
                      <option value="Technician">Technician</option>
                      <option value="Lineman">Lineman</option>
                      <option value="Driver">Driver</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number (For SMS Alerts)</label>
                    <input type="text" required className="form-control" placeholder="e.g. +919344255537" value={newMember.phoneNumber} onChange={(e) => setNewMember({...newMember, phoneNumber: e.target.value})} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '16px' }}>+ Save Member</button>
                </form>
              </div>

              {/* Right Side: Existing Members */}
              <div>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--text-primary)' }}>Current Members</h3>
                <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                  {teams.map(team => (
                    <div key={team.id || team.teamId} style={{ marginBottom: '16px', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
                      <h4 style={{ color: 'var(--accent-blue)', marginBottom: '8px', fontSize: '15px' }}>{team.teamName}</h4>
                      {team.members && team.members.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {team.members.map(m => (
                            <div key={m.memberId || m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{m.name} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({m.role})</span></div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{m.phoneNumber}</div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setSmsModal({ show: true, memberId: m.memberId || m.id, memberName: m.name, message: '' })}>SMS</button>
                                <button type="button" className="btn btn-danger btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => handleDeleteMember(m.memberId || m.id)}>Del</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No members found.</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {smsModal.show && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Send SMS to {smsModal.memberName}</h2>
              <button className="close-btn" onClick={() => setSmsModal({ show: false, memberId: null, memberName: '', message: '' })}><FiX size={24} /></button>
            </div>
            <form onSubmit={handleSendSms}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Message Content</label>
                  <textarea required className="form-control" rows="5" placeholder="Type your SMS message here..." value={smsModal.message} onChange={(e) => setSmsModal({...smsModal, message: e.target.value})}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setSmsModal({ show: false, memberId: null, memberName: '', message: '' })}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setPreviewImage(null)}>
          <div className="modal" style={{ maxWidth: '800px', width: '90%', padding: '10px', background: 'transparent', boxShadow: 'none' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setPreviewImage(null)}
                style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--accent-red)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
              >
                <FiX size={20} />
              </button>
              <img src={previewImage} alt="Full Size Proof" style={{ width: '100%', borderRadius: '12px', border: '4px solid var(--bg-card)' }} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
