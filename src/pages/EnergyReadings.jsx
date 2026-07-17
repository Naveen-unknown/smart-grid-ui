import { useState, useEffect } from 'react';
import { energyAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

export default function EnergyReadings() {
  const { user } = useAuth();
  const [readings, setReadings] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [filters, setFilters] = useState({ nodeId: '', page: 1 });

  const [form, setForm] = useState({
    nodeId: '', userId: user?.id || 1,
    consumption: '', production: '',
    voltage: '', current: '', powerFactor: '', frequency: '50', meterId: ''
  });

  useEffect(() => { loadData(); }, [filters]);
  useEffect(() => { loadAnalytics(); }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [readRes, nodesRes] = await Promise.all([
        energyAPI.getReadings({ nodeId: filters.nodeId || undefined, page: filters.page }),
        energyAPI.getNodes(),
      ]);
      setReadings(readRes.data.data || []);
      setNodes(nodesRes.data.data || []);
    } catch { toast.error('Failed to load readings'); }
    finally { setLoading(false); }
  };

  const loadAnalytics = async () => {
    try {
      const res = await energyAPI.getAnalytics({ period });
      setAnalytics(res.data.data);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await energyAPI.addReading({
        ...form,
        nodeId: parseInt(form.nodeId),
        userId: user?.id || 1,
        consumption: parseFloat(form.consumption),
        production: parseFloat(form.production),
        voltage: parseFloat(form.voltage),
        current: parseFloat(form.current),
        powerFactor: parseFloat(form.powerFactor),
        frequency: parseFloat(form.frequency),
      });
      toast.success('Reading added successfully!');
      setShowModal(false);
      setForm({ nodeId: '', userId: user?.id || 1, consumption: '', production: '', voltage: '', current: '', powerFactor: '', frequency: '50', meterId: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add reading');
    }
  };

  const chartData = analytics?.chartData || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Energy Readings</h2><p>Monitor power consumption and production</p></div>
        <div className="header-right">
          <select className="form-control" style={{ maxWidth: '150px' }}
            value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="hourly">Last 24h</option>
            <option value="daily">Last 7 Days</option>
            <option value="weekly">Last 30 Days</option>
            <option value="monthly">Last 12 Months</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Reading</button>
        </div>
      </div>

      <div className="page-body">
        {/* Analytics Cards */}
        {analytics?.analytics && (
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            {[
              { label: 'Total Consumption', value: `${analytics.analytics.totalConsumption} kWh`, icon: '⬇️', color: 'var(--gradient-blue)' },
              { label: 'Total Production', value: `${analytics.analytics.totalProduction} kWh`, icon: '⬆️', color: 'var(--gradient-green)' },
              { label: 'Avg Voltage', value: `${analytics.analytics.averageVoltage} V`, icon: '⚡', color: 'var(--gradient-purple)' },
              { label: 'Avg Power Factor', value: analytics.analytics.averagePowerFactor, icon: '📐', color: 'var(--gradient-cyan)' },
              { label: 'Peak Consumption', value: `${analytics.analytics.peakConsumption} kWh`, icon: '🔝', color: 'var(--gradient-orange)' },
              { label: 'Data Points', value: analytics.analytics.dataPoints, icon: '📊', color: 'var(--gradient-red)' },
            ].map((s, i) => (
              <div className="stat-card" key={i} style={{ '--card-accent': s.color }}>
                <div className="stat-icon-wrap" style={{ background: 'rgba(59,130,246,0.1)', fontSize: '22px' }}>{s.icon}</div>
                <div className="stat-content">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value" style={{ fontSize: '20px' }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header"><div className="card-title">📈 Consumption vs Production</div></div>
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                    <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="production" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="avgVoltage" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights */}
        {analytics?.insights && (
          <div className="ai-box" style={{ marginBottom: '20px' }}>
            <div className="ai-box-header">🤖 AI Analysis</div>
            <p>{analytics.insights}</p>
          </div>
        )}

        {/* Filter & Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 Readings History</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select className="form-control" style={{ maxWidth: '160px' }}
                value={filters.nodeId} onChange={e => setFilters({ ...filters, nodeId: e.target.value, page: 1 })}>
                <option value="">All Nodes</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.nodeId} – {n.location}</option>)}
              </select>
            </div>
          </div>
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : readings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⚡</div>
              <h3>No readings found</h3>
              <p>Click "Add Reading" to log energy data</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th><th>Node</th><th>Consumption</th>
                    <th>Production</th><th>Voltage</th><th>Current</th>
                    <th>Power Factor</th><th>Meter ID</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map(r => (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.timestamp).toLocaleString()}</td>
                      <td><span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{r.nodeName}</span></td>
                      <td>{r.consumption?.toFixed(2)} kWh</td>
                      <td>{r.production?.toFixed(2)} kWh</td>
                      <td>
                        <span style={{ color: r.voltage < 210 || r.voltage > 250 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                          {r.voltage?.toFixed(1)} V
                        </span>
                      </td>
                      <td>{r.current?.toFixed(1)} A</td>
                      <td>
                        <span style={{ color: r.powerFactor < 0.85 ? 'var(--accent-yellow)' : 'var(--text-primary)' }}>
                          {r.powerFactor?.toFixed(3)}
                        </span>
                      </td>
                      <td>{r.meterId || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Reading Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">⚡ Add Energy Reading</h3>
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
                    <label className="form-label">Consumption (kWh) *</label>
                    <input type="number" step="0.01" className="form-control" placeholder="e.g. 150.5"
                      value={form.consumption} onChange={e => setForm({ ...form, consumption: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Production (kWh) *</label>
                    <input type="number" step="0.01" className="form-control" placeholder="e.g. 120.0"
                      value={form.production} onChange={e => setForm({ ...form, production: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Voltage (V)</label>
                    <input type="number" step="0.1" className="form-control" placeholder="220"
                      value={form.voltage} onChange={e => setForm({ ...form, voltage: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current (A)</label>
                    <input type="number" step="0.1" className="form-control" placeholder="50"
                      value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Power Factor (0-1)</label>
                    <input type="number" step="0.001" min="0" max="1" className="form-control" placeholder="0.95"
                      value={form.powerFactor} onChange={e => setForm({ ...form, powerFactor: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Frequency (Hz)</label>
                    <input type="number" step="0.1" className="form-control" placeholder="50"
                      value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Meter ID (Optional)</label>
                  <input className="form-control" placeholder="MTR-001"
                    value={form.meterId} onChange={e => setForm({ ...form, meterId: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">✓ Add Reading</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
