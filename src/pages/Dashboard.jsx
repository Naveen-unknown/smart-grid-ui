import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, energyAPI } from '../api/services';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: '13px', fontWeight: 600 }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Maintenance Team') {
      navigate('/team-alerts');
    }
  }, [user, navigate]);

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [sumRes, nodesRes] = await Promise.all([
        dashboardAPI.getSummary(),
        energyAPI.getNodes(),
      ]);
      setSummary(sumRes.data.data);
      setNodes(nodesRes.data.data || []);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const { grid, faults, outages, energy, energyTrend = [], faultTrend = [], nodeStatus = [] } = summary || {};

  const severityColors = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#10b981' };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Real-time grid monitoring overview</p>
        </div>
        <div className="header-right">
          <div className="live-badge"><div className="live-dot" />Live</div>
          <button className="btn btn-outline btn-sm" onClick={loadDashboard}>↻ Refresh</button>
        </div>
      </div>

      <div className="page-body">
        {/* Stat Cards Row 1 */}
        <div className="stats-grid">
          <div className="stat-card" style={{ '--card-accent': 'var(--gradient-blue)' }}>
            <div className="stat-icon-wrap" style={{ background: 'rgba(59,130,246,0.12)' }}>🔌</div>
            <div className="stat-content">
              <div className="stat-label">Total Nodes</div>
              <div className="stat-value">{grid?.totalNodes ?? 0}</div>
              <div className="stat-sub up">▲ {grid?.activeNodes} Active</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--gradient-green)' }}>
            <div className="stat-icon-wrap" style={{ background: 'rgba(16,185,129,0.12)' }}>⚡</div>
            <div className="stat-content">
              <div className="stat-label">Today Consumption</div>
              <div className="stat-value">{energy?.todayConsumption ?? 0}</div>
              <div className="stat-sub">kWh</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--gradient-orange)' }}>
            <div className="stat-icon-wrap" style={{ background: 'rgba(249,115,22,0.12)' }}>🔧</div>
            <div className="stat-content">
              <div className="stat-label">Open Faults</div>
              <div className="stat-value">{faults?.open ?? 0}</div>
              <div className={`stat-sub ${faults?.critical > 0 ? 'down' : 'up'}`}>
                {faults?.critical} Critical
              </div>
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--gradient-red)' }}>
            <div className="stat-icon-wrap" style={{ background: 'rgba(239,68,68,0.12)' }}>🚨</div>
            <div className="stat-content">
              <div className="stat-label">Ongoing Outages</div>
              <div className="stat-value">{outages?.ongoing ?? 0}</div>
              <div className="stat-sub down">{outages?.affectedCustomers ?? 0} customers affected</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--gradient-purple)' }}>
            <div className="stat-icon-wrap" style={{ background: 'rgba(139,92,246,0.12)' }}>📈</div>
            <div className="stat-content">
              <div className="stat-label">Grid Health</div>
              <div className="stat-value">{grid?.nodeHealthPercent ?? 0}%</div>
              <div className="stat-sub up">▲ {grid?.activeNodes}/{grid?.totalNodes} Operational</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--gradient-cyan)' }}>
            <div className="stat-icon-wrap" style={{ background: 'rgba(6,182,212,0.12)' }}>⚙️</div>
            <div className="stat-content">
              <div className="stat-label">Avg Voltage</div>
              <div className="stat-value">{energy?.avgVoltage ?? 0}</div>
              <div className="stat-sub">Volts (Target: 220V)</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid-2" style={{ marginBottom: '20px' }}>
          {/* Energy Trend Chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">⚡ Energy Trend (7 Days)</div>
            </div>
            <div className="card-body">
              {energyTrend.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={energyTrend}>
                      <defs>
                        <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                      <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="consumption" stroke="#3b82f6" fill="url(#consGrad)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="production" stroke="#10b981" fill="url(#prodGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>No energy data yet</h3>
                  <p>Add energy readings to see trends</p>
                </div>
              )}
            </div>
          </div>

          {/* Fault Trend Chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🔧 Fault Trend (7 Days)</div>
            </div>
            <div className="card-body">
              {faultTrend.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={faultTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                      <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Total Faults" />
                      <Bar dataKey="critical" fill="#ef4444" radius={[4, 4, 0, 0]} name="Critical" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🔧</div>
                  <h3>No faults reported</h3>
                  <p>Grid is operating normally</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Node Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔌 Node Status Overview</div>
            <span className="badge badge-blue">{nodes.length} Nodes</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Node ID</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Voltage</th>
                  <th>Current</th>
                  <th>Power Factor</th>
                  <th>Open Faults</th>
                </tr>
              </thead>
              <tbody>
                {nodeStatus.map(n => (
                  <tr key={n.id}>
                    <td><span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{n.nodeId}</span></td>
                    <td>{n.location}</td>
                    <td><span className="badge badge-purple">{n.nodeType}</span></td>
                    <td>
                      <span className={`status-dot`}>
                        <span className={`dot dot-${n.status === 'Active' ? 'green' : n.status === 'Maintenance' ? 'yellow' : 'red'}`} />
                        {n.status}
                      </span>
                    </td>
                    <td>{n.lastReading ? `${n.lastReading.voltage.toFixed(1)} V` : '—'}</td>
                    <td>{n.lastReading ? `${n.lastReading.current.toFixed(1)} A` : '—'}</td>
                    <td>{n.lastReading ? n.lastReading.powerFactor.toFixed(3) : '—'}</td>
                    <td>
                      {n.openFaults > 0
                        ? <span className="badge badge-red">{n.openFaults}</span>
                        : <span className="badge badge-green">0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
