import { useState } from 'react';
import { dashboardAPI } from '../api/services';
import toast from 'react-hot-toast';

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const generateReport = async (e) => {
    e.preventDefault();
    if (new Date(dateRange.startDate) >= new Date(dateRange.endDate)) {
      toast.error('Start date must be before end date'); return;
    }
    setLoading(true);
    try {
      const res = await dashboardAPI.getReport(
        new Date(dateRange.startDate).toISOString(),
        new Date(dateRange.endDate).toISOString()
      );
      setReport(res.data.data);
      toast.success('Report generated successfully!');
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const metricIcons = {
    'Total Readings': '📊', 'Total Consumption (kWh)': '⬇️',
    'Total Production (kWh)': '⬆️', 'Avg Voltage (V)': '⚡',
    'Avg Power Factor': '📐', 'Total Faults': '🔧',
    'Critical Faults': '🔴', 'Resolved Faults': '✅',
    'Total Outages': '🚨', 'Customers Affected': '👥',
    'Avg Restoration Time (hrs)': '⏱️',
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Reports</h2><p>AI-generated grid performance reports</p></div>
        <div className="header-right">
          <div className="live-badge" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
            🤖 AI Report
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Date Range Selector */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header"><div className="card-title">📅 Select Report Period</div></div>
          <div className="card-body">
            <form onSubmit={generateReport}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '160px' }}>
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control"
                    value={dateRange.startDate}
                    onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })} required />
                </div>
                <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '160px' }}>
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control"
                    value={dateRange.endDate}
                    onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })} required />
                </div>
                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingBottom: '2px' }}>
                  {[
                    { label: 'Last 7 Days', days: 7 },
                    { label: 'Last 30 Days', days: 30 },
                    { label: 'Last 90 Days', days: 90 },
                  ].map(p => (
                    <button key={p.days} type="button" className="btn btn-outline btn-sm"
                      onClick={() => setDateRange({
                        startDate: new Date(Date.now() - p.days * 86400000).toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0]
                      })}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}
                  style={{ paddingBottom: '11px' }}>
                  {loading ? '⏳ Generating...' : '🤖 Generate AI Report'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {loading && (
          <div className="spinner-wrap" style={{ minHeight: '300px' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>GitHub AI is analyzing your grid data...</p>
            </div>
          </div>
        )}

        {report && !loading && (
          <div className="slide-up">
            {/* Period Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '16px'
            }}>
              <span style={{ fontSize: '36px' }}>📋</span>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Grid Performance Report
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  📅 {new Date(report.period.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  {' → '}
                  {new Date(report.period.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  &nbsp;·&nbsp; <strong>{report.period.days}</strong> days analyzed
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', background: 'rgba(139,92,246,0.15)', padding: '6px 14px', borderRadius: '20px' }}>
                  🤖 AI Generated
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              {Object.entries(report.metrics).map(([key, value]) => (
                <div key={key} className="stat-card" style={{ '--card-accent': 'var(--gradient-blue)', padding: '14px 16px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{metricIcons[key] || '📌'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>{key}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
                  </div>
                </div>
              ))}
            </div>

            {/* AI Report */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(59,130,246,0.06))',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid rgba(139,92,246,0.2)',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#a78bfa' }}>AI Executive Report</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Generated by GitHub AI (GPT-4o) · {new Date(report.generatedAt).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{
                  fontSize: '14px', color: 'var(--text-secondary)',
                  lineHeight: '1.9', whiteSpace: 'pre-wrap', fontFamily: 'inherit'
                }}>
                  {report.aiReport}
                </div>
              </div>
            </div>
          </div>
        )}

        {!report && !loading && (
          <div className="card">
            <div className="empty-state" style={{ padding: '80px 20px' }}>
              <div className="empty-icon">📋</div>
              <h3>No report generated yet</h3>
              <p>Select a date range and click "Generate AI Report" to get a comprehensive analysis</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
