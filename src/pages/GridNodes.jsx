import { useState, useEffect } from 'react';
import { energyAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = { Active: 'badge-green', Inactive: 'badge-red', Maintenance: 'badge-yellow' };

export default function GridNodes() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeSummary, setNodeSummary] = useState(null);

  const [form, setForm] = useState({
    nodeId: '', location: '', status: 'Active',
    latitude: '', longitude: '', nodeType: 'Substation', maxCapacity: ''
  });

  useEffect(() => { loadNodes(); }, []);

  const loadNodes = async () => {
    setLoading(true);
    try {
      const res = await energyAPI.getNodes();
      setNodes(res.data.data || []);
    } catch { toast.error('Failed to load nodes'); }
    finally { setLoading(false); }
  };

  const handleSelectNode = async (node) => {
    setSelectedNode(node);
    try {
      const res = await energyAPI.getNodeSummary(node.id);
      setNodeSummary(res.data.data);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await energyAPI.createNode({
        ...form,
        latitude: parseFloat(form.latitude) || undefined,
        longitude: parseFloat(form.longitude) || undefined,
        maxCapacity: parseFloat(form.maxCapacity) || undefined,
      });
      toast.success('Node created successfully!');
      setShowModal(false);
      setForm({ nodeId: '', location: '', status: 'Active', latitude: '', longitude: '', nodeType: 'Substation', maxCapacity: '' });
      loadNodes();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create node'); }
  };

  const handleStatusUpdate = async (nodeId, status) => {
    try {
      await energyAPI.updateNodeStatus(nodeId, status);
      toast.success(`Node status updated to ${status}`);
      loadNodes();
      if (selectedNode?.id === nodeId) setSelectedNode({ ...selectedNode, status });
    } catch { toast.error('Failed to update node status'); }
  };

  const handleSendSmsAlert = async (nodeId, e) => {
    e.stopPropagation();
    try {
      const res = await energyAPI.sendNodeSmsAlert(nodeId);
      toast.success(res.data.message || 'SMS sent successfully');
    } catch { toast.error('Failed to send SMS'); }
  };

  const typeColors = { Substation: 'badge-blue', Distribution: 'badge-purple', Feeder: 'badge-cyan' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Grid Nodes</h2><p>Manage and monitor electricity grid nodes</p></div>
        <div className="header-right">
          {(user?.role === 'Admin') && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Node</button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '1fr 380px' : '1fr', gap: '20px' }}>
          {/* Node Cards Grid */}
          <div>
            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : (
              <div className="node-grid">
                {nodes.map(node => (
                  <div key={node.id} className={`node-card ${selectedNode?.id === node.id ? 'selected' : ''}`}
                    onClick={() => handleSelectNode(node)}
                    style={{ borderColor: selectedNode?.id === node.id ? 'var(--accent-blue)' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div className="node-id">{node.nodeId}</div>
                        <div className="node-location">{node.location}</div>
                      </div>
                      <span className={`badge ${STATUS_COLORS[node.status] || 'badge-gray'}`}>{node.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <span className={`badge ${typeColors[node.nodeType] || 'badge-gray'}`}>{node.nodeType}</span>
                      {node.maxCapacity && <span className="badge badge-gray">{node.maxCapacity} kW</span>}
                    </div>
                    {node.latitude && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        📍 {node.latitude.toFixed(4)}, {node.longitude?.toFixed(4)}
                      </div>
                    )}
                    {(user?.role === 'Admin' || user?.role === 'Operator' || user?.role === 'Electricity Officer') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {['Active', 'Maintenance', 'Inactive'].map(s => (
                            <button key={s} className={`btn btn-sm ${node.status === s ? 'btn-primary' : 'btn-outline'}`}
                              onClick={() => handleStatusUpdate(node.id, s)}>
                              {s}
                            </button>
                          ))}
                        </div>
                        {node.status === 'Maintenance' && (
                          <button 
                            className="btn btn-sm btn-outline" 
                            style={{ borderColor: 'var(--accent-yellow)', color: 'var(--accent-yellow)', width: 'fit-content', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }} 
                            onClick={(e) => handleSendSmsAlert(node.id, e)}
                          >
                            <span>📱</span> Send SMS (No Power Today)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {nodes.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">🔌</div>
                    <h3>No nodes found</h3>
                    <p>Add grid nodes to start monitoring</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Node Detail Panel */}
          {selectedNode && nodeSummary && (
            <div className="card slide-up" style={{ height: 'fit-content', position: 'sticky', top: '90px' }}>
              <div className="card-header">
                <div className="card-title">🔌 {selectedNode.nodeId}</div>
                <button className="close-btn" onClick={() => { setSelectedNode(null); setNodeSummary(null); }}>✕</button>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{selectedNode.location}</div>
                  <span className={`badge ${STATUS_COLORS[selectedNode.status]}`}>{selectedNode.status}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { label: "Today's Consumption", value: `${nodeSummary.todayConsumption?.toFixed(2)} kWh` },
                    { label: "Today's Production", value: `${nodeSummary.todayProduction?.toFixed(2)} kWh` },
                    { label: 'Avg Voltage', value: `${nodeSummary.averageVoltage?.toFixed(1)} V` },
                    { label: 'Power Factor', value: nodeSummary.averagePowerFactor?.toFixed(3) },
                    { label: 'Readings Today', value: nodeSummary.todayReadingCount },
                    { label: 'Open Faults', value: nodeSummary.openFaults, warn: nodeSummary.openFaults > 0 },
                  ].map(({ label, value, warn }) => (
                    <div key={label} style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: warn ? 'var(--accent-red)' : 'var(--text-primary)' }}>{value ?? '—'}</div>
                    </div>
                  ))}
                </div>

                {nodeSummary.latestReading && (
                  <>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Latest Reading
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '12px' }}>
                      {[
                        ['Voltage', `${nodeSummary.latestReading.voltage} V`],
                        ['Current', `${nodeSummary.latestReading.current} A`],
                        ['Power Factor', nodeSummary.latestReading.powerFactor],
                        ['Timestamp', new Date(nodeSummary.latestReading.timestamp).toLocaleString()],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{k}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Node Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">🔌 Add Grid Node</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Node ID *</label>
                    <input className="form-control" placeholder="NODE-006"
                      value={form.nodeId} onChange={e => setForm({ ...form, nodeId: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Node Type</label>
                    <select className="form-control" value={form.nodeType}
                      onChange={e => setForm({ ...form, nodeType: e.target.value })}>
                      <option>Substation</option><option>Distribution</option><option>Feeder</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Location *</label>
                  <input className="form-control" placeholder="e.g. South Industrial Zone"
                    value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Latitude</label>
                    <input type="number" step="0.0001" className="form-control" placeholder="40.7128"
                      value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude</label>
                    <input type="number" step="0.0001" className="form-control" placeholder="-74.0060"
                      value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Max Capacity (kW)</label>
                    <input type="number" className="form-control" placeholder="5000"
                      value={form.maxCapacity} onChange={e => setForm({ ...form, maxCapacity: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Status</label>
                    <select className="form-control" value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option>Active</option><option>Inactive</option><option>Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">+ Create Node</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
