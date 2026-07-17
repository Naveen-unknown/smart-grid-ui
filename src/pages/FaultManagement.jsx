import { useState, useEffect } from 'react';
import { faultAPI, energyAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

const SEVERITY_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };
const STATUS_BADGE = { Reported: 'badge-red', InProgress: 'badge-yellow', 'Pending Verification': 'badge-orange', Resolved: 'badge-green', Closed: 'badge-gray' };

export default function FaultManagement() {
  const { user } = useAuth();
  const [faults, setFaults] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });
  const [filters, setFilters] = useState({ status: '', severity: '', nodeId: '' });

  const [form, setForm] = useState({
    nodeId: '', reportedByUserId: user?.id || 1,
    faultType: '', description: '', severity: 'Medium', assignedTo: ''
  });

  useEffect(() => { 
    loadData(); 
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fRes, nRes, sRes] = await Promise.all([
        faultAPI.getFaults(filters),
        energyAPI.getNodes(),
        faultAPI.getStats(),
      ]);
      setFaults(fRes.data.data || []);
      setNodes(nRes.data.data || []);
      setStats(sRes.data.data);
    } catch { toast.error('Failed to load faults'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await faultAPI.reportFault({ ...form, nodeId: parseInt(form.nodeId), reportedByUserId: user?.id || 1 });
      toast.success('Fault reported with AI analysis!');
      setShowModal(false);
      setForm({ nodeId: '', reportedByUserId: user?.id || 1, faultType: '', description: '', severity: 'Medium', assignedTo: '' });
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to report fault'); }
  };

  const handleStatusUpdate = async () => {
    try {
      await faultAPI.updateStatus(showStatusModal.id, statusUpdate);
      toast.success('Status updated!');
      setShowStatusModal(null);
      loadData();
    } catch (err) { toast.error('Failed to update status'); }
  };

  const handlePredict = async (nodeId) => {
    try {
      const res = await faultAPI.predictFaults(nodeId);
      setPrediction(res.data.data);
    } catch { toast.error('Prediction failed'); }
  };

  const pieData = stats ? Object.entries(stats.bySeverity || {}).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Fault Management</h2><p>Track and resolve grid faults with AI assistance</p></div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>🔧 Report Fault</button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        {stats && (
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card" style={{ '--card-accent': 'var(--gradient-blue)' }}>
              <div className="stat-icon-wrap" style={{ background: 'rgba(59,130,246,0.1)' }}>📋</div>
              <div className="stat-content">
                <div className="stat-label">Total Faults</div>
                <div className="stat-value">{stats.total}</div>
              </div>
            </div>
            {Object.entries(stats.byStatus || {}).map(([status, count]) => (
              <div className="stat-card" key={status}
                style={{ '--card-accent': status === 'Reported' ? 'var(--gradient-red)' : status === 'InProgress' ? 'var(--gradient-orange)' : 'var(--gradient-green)' }}>
                <div className="stat-icon-wrap" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  {status === 'Reported' ? '🔴' : status === 'InProgress' ? '🟡' : '🟢'}
                </div>
                <div className="stat-content">
                  <div className="stat-label">{status}</div>
                  <div className="stat-value">{count}</div>
                </div>
              </div>
            ))}
            <div className="stat-card" style={{ '--card-accent': 'var(--gradient-purple)' }}>
              <div className="stat-icon-wrap" style={{ background: 'rgba(139,92,246,0.1)' }}>⏱️</div>
              <div className="stat-content">
                <div className="stat-label">Avg Resolution</div>
                <div className="stat-value" style={{ fontSize: '18px' }}>{stats.avgResolutionHours?.toFixed(1) || '—'}h</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid-2" style={{ marginBottom: '20px' }}>
          {/* Severity Chart */}
          <div className="card">
            <div className="card-header"><div className="card-title">📊 Faults by Severity</div></div>
            <div className="card-body">
              {pieData.length > 0 ? (
                <div className="chart-container" style={{ height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={SEVERITY_COLORS[entry.name] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="empty-state"><div className="empty-icon">✅</div><h3>No faults reported</h3></div>}
            </div>
          </div>

          {/* AI Prediction Panel */}
          <div className="card">
            <div className="card-header"><div className="card-title">🤖 AI Fault Prediction</div></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Select Node to Analyze</label>
                <select className="form-control" onChange={e => e.target.value && handlePredict(parseInt(e.target.value))}>
                  <option value="">Choose a node...</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.nodeId} – {n.location}</option>)}
                </select>
              </div>
              {prediction ? (
                <div className="ai-box">
                  <div className="ai-box-header">🤖 AI Prediction for {prediction.node?.nodeId}</div>
                  <p>{prediction.aIPrediction}</p>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Based on {prediction.readingsAnalyzed} readings • {prediction.recentFaults30Days} faults in last 30 days
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '30px 20px' }}>
                  <div className="empty-icon">🔮</div>
                  <h3>Select a node</h3>
                  <p>AI will analyze readings and predict potential faults</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Faults Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔧 Fault Reports</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select className="form-control" style={{ maxWidth: '140px' }}
                value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All Status</option>
                <option value="Reported">Reported</option>
                <option value="InProgress">In Progress</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              <select className="form-control" style={{ maxWidth: '140px' }}
                value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value })}>
                <option value="">All Severity</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : faults.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>No faults found</h3>
              <p>Grid is running smoothly</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Node</th><th>Type</th><th>Severity</th>
                    <th>Status</th><th>Reported</th><th>AI Score</th>
                  </tr>
                </thead>
                <tbody>
                  {faults.map(f => (
                    <tr key={f.id}>
                      <td style={{ color: 'var(--text-muted)' }}>#{f.id}</td>
                      <td><span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{f.nodeIdentifier}</span><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.nodeLocation}</div></td>
                      <td>{f.faultType}</td>
                      <td>
                        <span className={`badge badge-${f.severity === 'Critical' ? 'red' : f.severity === 'High' ? 'orange' : f.severity === 'Medium' ? 'yellow' : 'green'}`}>
                          {f.severity}
                        </span>
                      </td>
                      <td><span className={`badge ${STATUS_BADGE[f.status] || 'badge-gray'}`}>{f.status}</span></td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>{new Date(f.reportedAt).toLocaleDateString()}</td>
                      <td>{f.confidenceScore ? `${(f.confidenceScore * 100).toFixed(0)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Report Fault Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">🔧 Report New Fault</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Grid Node *</label>
                  <select className="form-control" value={form.nodeId}
                    onChange={e => setForm({ ...form, nodeId: e.target.value })} required>
                    <option value="">Select node...</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.nodeId} – {n.location}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fault Type *</label>
                    <select className="form-control" value={form.faultType}
                      onChange={e => setForm({ ...form, faultType: e.target.value })} required>
                      <option value="">Select type...</option>
                      <option>Short Circuit</option><option>Overload</option>
                      <option>Ground Fault</option><option>Equipment Failure</option>
                      <option>Transformer Issue</option><option>Cable Damage</option><option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Severity</label>
                    <select className="form-control" value={form.severity}
                      onChange={e => setForm({ ...form, severity: e.target.value })}>
                      <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-control" placeholder="Describe the fault in detail..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <input className="form-control" placeholder="Technician name (optional)"
                    value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger">🔧 Report Fault</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowStatusModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Update Fault #{showStatusModal.id}</h3>
              <button className="close-btn" onClick={() => setShowStatusModal(null)}>✕</button>
            </div>
            {showStatusModal.aiPrediction && (
              <div className="ai-box" style={{ margin: '0 24px 0' }}>
                <div className="ai-box-header">🤖 AI Analysis</div>
                <p style={{ fontSize: '12px' }}>{showStatusModal.aiPrediction.slice(0, 300)}...</p>
              </div>
            )}
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">New Status *</label>
                <select className="form-control" value={statusUpdate.status}
                  onChange={e => setStatusUpdate({ ...statusUpdate, status: e.target.value })} required>
                  <option value="">Select status...</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Resolution Notes</label>
                <textarea className="form-control" placeholder="What action was taken?"
                  value={statusUpdate.notes} onChange={e => setStatusUpdate({ ...statusUpdate, notes: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowStatusModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={!statusUpdate.status}>Update Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
