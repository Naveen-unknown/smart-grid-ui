import { useState, useEffect } from 'react';
import { dashboardAPI } from '../api/services';
import toast from 'react-hot-toast';

export default function AIInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadInsights(); }, []);

  const loadInsights = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await dashboardAPI.getAIInsights();
      setInsights(res.data.data);
    } catch { toast.error('Failed to load AI insights'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const sections = insights ? [
    {
      icon: '💚', title: 'Grid Health Assessment', key: 'healthInsights',
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.08))',
      border: 'rgba(16,185,129,0.2)', accent: '#34d399'
    },
    {
      icon: '⚡', title: 'Energy Analysis & Efficiency', key: 'energyInsights',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
      border: 'rgba(59,130,246,0.2)', accent: '#60a5fa'
    },
    {
      icon: '⚖️', title: 'Load Distribution Optimization', key: 'loadOptimization',
      gradient: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.08))',
      border: 'rgba(245,158,11,0.2)', accent: '#fbbf24'
    },
  ] : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>AI Insights</h2>
          <p>GitHub AI-powered grid analysis and recommendations</p>
        </div>
        <div className="header-right">
          <div className="live-badge" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
            🤖 GitHub AI
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => loadInsights(true)} disabled={refreshing}>
            {refreshing ? '⏳' : '↻'} Refresh Analysis
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '24px'
        }}>
          <div style={{ fontSize: '56px' }}>🤖</div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              AI-Powered Grid Intelligence
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Powered by <strong style={{ color: '#a78bfa' }}>GitHub AI (GPT-4o)</strong>, this system analyzes your grid's real-time data to detect anomalies,
              predict faults, optimize load distribution, and generate actionable recommendations to keep
              your electricity grid running at peak efficiency.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="spinner-wrap" style={{ minHeight: '300px' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>GitHub AI is analyzing your grid...</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {sections.map(s => (
              <div key={s.key} style={{
                background: s.gradient,
                border: `1px solid ${s.border}`,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden'
              }}>
                {/* Section Header */}
                <div style={{
                  padding: '18px 24px',
                  borderBottom: `1px solid ${s.border}`,
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <span style={{ fontSize: '24px' }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: s.accent }}>{s.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Generated at {new Date(insights.generatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: s.accent, background: `rgba(0,0,0,0.2)`, padding: '4px 10px', borderRadius: '20px' }}>
                      🤖 AI Generated
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '20px 24px' }}>
                  {insights[s.key] ? (
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.85',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit'
                    }}>
                      {insights[s.key]}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: '24px' }}>
                      <div className="empty-icon">📊</div>
                      <h3>Insufficient data</h3>
                      <p>Add more energy readings to generate insights</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Tips Section */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">💡 How AI Analysis Works</div>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {[
                    { icon: '📡', title: 'Data Collection', desc: 'Real-time energy readings from all grid nodes' },
                    { icon: '🧠', title: 'AI Processing', desc: 'GitHub GPT-4o analyzes patterns, anomalies and trends' },
                    { icon: '🔮', title: 'Prediction', desc: 'Fault prediction using voltage, current & power factor' },
                    { icon: '📋', title: 'Recommendations', desc: 'Actionable steps to optimize performance' },
                  ].map(t => (
                    <div key={t.title} style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{t.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
