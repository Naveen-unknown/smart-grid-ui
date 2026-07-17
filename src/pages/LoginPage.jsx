import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ usernameOrEmail: '', password: '' });
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(loginForm);
      const { data } = res.data;
      login({ id: data.id, username: data.username, email: data.email, role: data.role }, data.token);
      toast.success(`Welcome back, ${data.username}! ⚡`);
      if (data.role === 'Maintenance') navigate('/team-alerts');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register(regForm);
      const { data } = res.data;
      login({ id: data.id, username: data.username, email: data.email, role: data.role }, data.token);
      toast.success('Account created! Welcome to SmartGrid ⚡');
      if (data.role === 'Maintenance') navigate('/team-alerts');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* Animated background grid */}
      <div className="auth-bg-grid" />
      <div className="auth-bg-glow auth-bg-glow-1" />
      <div className="auth-bg-glow auth-bg-glow-2" />

      {/* Main card */}
      <div className="auth-card">
        {/* Left Panel – Brand */}
        <div className="auth-brand-panel">
          <div className="auth-brand-inner">
            {/* Logo */}
            <div className="auth-logo" style={{ marginBottom: '2rem' }}>
              <img src="/logo.png" alt="Smart Grid Monitoring System" style={{ width: '100%', maxWidth: '350px', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }} />
            </div>

            {/* Headline */}
            <div className="auth-brand-headline">
              <h1>Power the Future<br /><span>with Smart Energy</span></h1>
              <p>Real-time monitoring, AI-driven insights, and intelligent control for modern electricity grids.</p>
            </div>

            {/* Feature badges */}
            <div className="auth-features">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">⚡</div>
                <div>
                  <div className="auth-feature-title">Live Grid Monitoring</div>
                  <div className="auth-feature-desc">Real-time node and energy tracking</div>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">🤖</div>
                <div>
                  <div className="auth-feature-title">AI-Powered Insights</div>
                  <div className="auth-feature-desc">GitHub AI-driven fault prediction</div>
                </div>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">🛡️</div>
                <div>
                  <div className="auth-feature-title">Fault & Outage Control</div>
                  <div className="auth-feature-desc">Automated alerts and response</div>
                </div>
              </div>
            </div>

            {/* Animated grid stats */}
            <div className="auth-stats">
              <div className="auth-stat">
                <span className="auth-stat-val">99.8%</span>
                <span className="auth-stat-label">Uptime</span>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <span className="auth-stat-val">5</span>
                <span className="auth-stat-label">Grid Nodes</span>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <span className="auth-stat-val">AI</span>
                <span className="auth-stat-label">GitHub AI</span>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <p style={{ margin: '0' }}><strong>Electricity Officer:</strong> electricity_officer / Admin@123</p>
              <p style={{ margin: '0' }}><strong>Maintenance Team:</strong> maintenance_team / Admin@123</p>
            </div>
          </div>
        </div>

        {/* Right Panel – Form */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            {/* Tab switcher */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                onClick={() => setTab('login')}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
                onClick={() => setTab('register')}
              >
                Sign Up
              </button>
            </div>

            {tab === 'login' ? (
              <div className="auth-form-content">
                <div className="auth-form-header">
                  <h2>Welcome back</h2>
                  <p>Enter your credentials to access the grid dashboard</p>
                </div>

                {/* Demo credentials quick fill */}
                <button
                  type="button"
                  className="auth-demo-btn"
                  onClick={() => {
                    setLoginForm({ usernameOrEmail: 'admin@smartgrid.com', password: 'Admin@123' });
                    toast.success('Demo credentials filled!');
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  Use Demo Admin Credentials
                </button>

                <form onSubmit={handleLogin}>
                  <div className="auth-field">
                    <label className="auth-label">Email or Username</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </span>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="admin@smartgrid.com"
                        value={loginForm.usernameOrEmail}
                        onChange={e => setLoginForm({ ...loginForm, usernameOrEmail: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Password</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </span>
                      <input
                        type={showLoginPwd ? 'text' : 'password'}
                        className="auth-input"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                      <button type="button" className="auth-pwd-toggle" onClick={() => setShowLoginPwd(v => !v)}>
                        {showLoginPwd ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? (
                      <><span className="auth-spinner" /> Signing in...</>
                    ) : (
                      <><span>⚡</span> Sign In</>
                    )}
                  </button>
                </form>

                <div className="auth-switch-text">
                  Don't have an account?{' '}
                  <button className="auth-switch-link" onClick={() => setTab('register')}>
                    Create account
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-form-content">
                <div className="auth-form-header">
                  <h2>Create account</h2>
                  <p>Join the Smart Grid monitoring platform</p>
                </div>

                <form onSubmit={handleRegister}>
                  <div className="auth-field">
                    <label className="auth-label">Username</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </span>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="yourname"
                        value={regForm.username}
                        onChange={e => setRegForm({ ...regForm, username: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Email Address</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </span>
                      <input
                        type="email"
                        className="auth-input"
                        placeholder="you@example.com"
                        value={regForm.email}
                        onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Password</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </span>
                      <input
                        type={showRegPwd ? 'text' : 'password'}
                        className="auth-input"
                        placeholder="Min 8 characters"
                        value={regForm.password}
                        onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                        required
                      />
                      <button type="button" className="auth-pwd-toggle" onClick={() => setShowRegPwd(v => !v)}>
                        {showRegPwd ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Confirm Password</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </span>
                      <input
                        type={showConfirmPwd ? 'text' : 'password'}
                        className="auth-input"
                        placeholder="Repeat password"
                        value={regForm.confirmPassword}
                        onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                        required
                      />
                      <button type="button" className="auth-pwd-toggle" onClick={() => setShowConfirmPwd(v => !v)}>
                        {showConfirmPwd ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? (
                      <><span className="auth-spinner" /> Creating account...</>
                    ) : (
                      <><span>⚡</span> Create Account</>
                    )}
                  </button>
                </form>

                <div className="auth-switch-text">
                  Already have an account?{' '}
                  <button className="auth-switch-link" onClick={() => setTab('login')}>
                    Sign in
                  </button>
                </div>
              </div>
            )}

            <div className="auth-footer">
              © {new Date().getFullYear()} SmartGrid Inc. · Privacy · Terms
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
