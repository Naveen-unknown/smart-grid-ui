import { useState, useEffect } from 'react';
import { outageAPI, energyAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_BADGE = { Ongoing: 'badge-red', Restored: 'badge-green', UnderInvestigation: 'badge-yellow' };

export default function OutageManagement() {
  const { user } = useAuth();
  const [outages, setOutages] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [restoreModal, setRestoreModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const [form, setForm] = useState({
    nodeId: '', affectedArea: '', affectedCustomers: '',
    cause: '', outageType: 'Unplanned', reportedByUserId: user?.id || 1,
    estimatedRestorationTime: ''
  });

  useEffect(() => { loadData(); }, [filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [oRes, nRes, sRes] = await Promise.all([
        outageAPI.getOutages({ status: filterStatus || undefined }),
        energyAPI.getNodes(),
        outageAPI.getStats(),
      ]);
      setOutages(oRes.data.data || []);
      setNodes(nRes.data.data || []);
      setStats(sRes.data.data);
    } catch { toast.error('Failed to load outages'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await outageAPI.reportOutage({
        ...form,
        nodeId: parseInt(form.nodeId),
        affectedCustomers: parseInt(form.affectedCustomers) || 0,
        reportedByUserId: user?.id || 1,
        estimatedRestorationTime: form.estimatedRestorationTime || undefined
      });
      toast.success('Outage reported! AI analysis in progress...');
      setShowModal(false);
      setForm({ nodeId: '', affectedArea: '', affectedCustomers: '', cause: '', outageType: 'Unplanned', reportedByUserId: user?.id || 1, estimatedRestorationTime: '' });
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to report outage'); }
  };

  const handleRestore = async () => {
    try {
      await outageAPI.restoreOutage(restoreModal.id, { actionTaken });
      toast.success('Outage marked as restored!');
      setRestoreModal(null);
      setActionTaken('');
      loadData();
    } catch { toast.error('Failed to restore outage'); }
  };

  const getDuration = (o) => {
    const end = o.restoredAt ? new Date(o.restoredAt) : new Date();
    const start = new Date(o.startedAt);
    const hrs = ((end - start) / 3600000).toFixed(1);
    return `${hrs}h`;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Outage Management</h2><p>Monitor and resolve power outages in real-time</p></div>
        <div className="header-right">
          <button className="btn btn-danger" onClick={() => setShowModal(true)}>🚨 Report Outage</button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        {stats && (
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card" style={{ '--card-accent': 'var(--gradient-red)' }}>
              <div className="stat-icon-wrap" style={{ background: 'rgba(239,68,68,0.1)' }}>🔴</div>
              <div className="stat-content">
                <div className="stat-label">Ongoing Outages</div>
                <div className="stat-value">{stats.ongoing}</div>
              </div>
            </div>
            <div className="stat-card" style={{ '--card-accent': 'var(--gradient-orange)' }}>
              <div className="stat-icon-wrap" style={{ background: 'rgba(249,115,22,0.1)' }}>👥</div>
              <div className="stat-content">
                <div className="stat-label">Customers Affected</div>
                <div className="stat-value">{stats.totalAffectedCustomers?.toLocaleString()}</div>
              </div>
            </div>
            <div className="stat-card" style={{ '--card-accent': 'var(--gradient-green)' }}>
              <div className="stat-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)' }}>✅</div>
              <div className="stat-content">
                <div className="stat-label">Restored</div>
                <div className="stat-value">{stats.restored}</div>
              </div>
            </div>
            <div className="stat-card" style={{ '--card-accent': 'var(--gradient-purple)' }}>
              <div className="stat-icon-wrap" style={{ background: 'rgba(139,92,246,0.1)' }}>⏱️</div>
              <div className="stat-content">
                <div className="stat-label">Avg Restoration Time</div>
                <div className="stat-value" style={{ fontSize: '18px' }}>{stats.avgRestorationHours?.toFixed(1) || '—'}h</div>
              </div>
            </div>
            <div className="stat-card" style={{ '--card-accent': 'var(--gradient-blue)' }}>
              <div className="stat-icon-wrap" style={{ background: 'rgba(59,130,246,0.1)' }}>📅</div>
              <div className="stat-content">
                <div className="stat-label">Last 30 Days</div>
                <div className="stat-value">{stats.last30Days}</div>
              </div>
            </div>
            <div className="stat-card" style={{ '--card-accent': 'var(--gradient-cyan)' }}>
              <div className="stat-icon-wrap" style={{ background: 'rgba(6,182,212,0.1)' }}>📊</div>
              <div className="stat-content">
                <div className="stat-label">Total Outages</div>
                <div className="stat-value">{stats.total}</div>
              </div>
            </div>
          </div>
        )}

        {/* Ongoing Alert Banner */}
        {stats?.ongoing > 0 && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px'
          }}>
            <span style={{ fontSize: '22px', animation: 'pulse-green 1.5s infinite' }}>🚨</span>
            <div>
              <div style={{ fontWeight: 700, color: '#f87171' }}>
                {stats.ongoing} Active Outage{stats.ongoing > 1 ? 's' : ''} Detected
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {stats.totalAffectedCustomers?.toLocaleString()} customers currently without power. Immediate action required.
              </div>
            </div>
          </div>
        )}

        {/* Outage Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🚨 Outage Records</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select className="form-control" style={{ maxWidth: '160px' }}
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Restored">Restored</option>
                <option value="UnderInvestigation">Investigating</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : outages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>No outages found</h3>
              <p>All nodes operating normally</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Node</th><th>Affected Area</th><th>Customers</th>
                    <th>Type</th><th>Status</th><th>Started</th><th>Duration</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {outages.map(o => (
                    <tr key={o.id}>
                      <td style={{ color: 'var(--text-muted)' }}>#{o.id}</td>
                      <td><span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{o.nodeIdentifier}</span></td>
                      <td>{o.affectedArea}</td>
                      <td>{o.affectedCustomers?.toLocaleString() || '—'}</td>
                      <td><span className={`badge ${o.outageType === 'Planned' ? 'badge-blue' : 'badge-orange'}`}>{o.outageType}</span></td>
                      <td><span className={`badge ${STATUS_BADGE[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{new Date(o.startedAt).toLocaleString()}</td>
                      <td>
                        <span style={{ color: o.status === 'Ongoing' ? 'var(--accent-red)' : 'var(--text-secondary)', fontWeight: 600 }}>
                          {getDuration(o)}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDetailModal(o)}>👁</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Report Outage Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">🚨 Report Power Outage</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Grid Node *</label>
                    <select className="form-control" value={form.nodeId}
                      onChange={e => setForm({ ...form, nodeId: e.target.value })} required>
                      <option value="">Select node...</option>
                      {nodes.map(n => <option key={n.id} value={n.id}>{n.nodeId} – {n.location}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Outage Type</label>
                    <select className="form-control" value={form.outageType}
                      onChange={e => setForm({ ...form, outageType: e.target.value })}>
                      <option>Unplanned</option><option>Planned</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Affected Area *</label>
                  <input className="form-control" placeholder="e.g. Downtown, Sector 5"
                    value={form.affectedArea} onChange={e => setForm({ ...form, affectedArea: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Affected Customers</label>
                    <input type="number" className="form-control" placeholder="e.g. 500"
                      value={form.affectedCustomers} onChange={e => setForm({ ...form, affectedCustomers: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Est. Restoration Time</label>
                    <input type="datetime-local" className="form-control"
                      value={form.estimatedRestorationTime} onChange={e => setForm({ ...form, estimatedRestorationTime: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Cause</label>
                  <textarea className="form-control" placeholder="What caused the outage?"
                    value={form.cause} onChange={e => setForm({ ...form, cause: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger">🚨 Report Outage</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Detail Modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailModal(null)}>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🚨 Outage Details #{detailModal.id}</h3>
              <button className="close-btn" onClick={() => setDetailModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {[
                  ['Node', detailModal.nodeIdentifier], ['Area', detailModal.affectedArea],
                  ['Customers', detailModal.affectedCustomers?.toLocaleString()], ['Type', detailModal.outageType],
                  ['Started', new Date(detailModal.startedAt).toLocaleString()],
                  ['Restored', detailModal.restoredAt ? new Date(detailModal.restoredAt).toLocaleString() : 'Ongoing'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
              {detailModal.cause && (
                <div className="form-group">
                  <label className="form-label">Cause</label>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px' }}>{detailModal.cause}</p>
                </div>
              )}
              {detailModal.aiAnalysis && (
                <div className="ai-box">
                  <div className="ai-box-header">🤖 AI Analysis</div>
                  <p>{detailModal.aiAnalysis}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
