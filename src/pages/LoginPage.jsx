import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [loginType, setLoginType] = useState('officer'); // 'officer' or 'maintenance'
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Standard Login (Officer/Admin)
  const [loginForm, setLoginForm] = useState({ usernameOrEmail: '', password: '' });
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // OTP Login (Maintenance)
  const [otpStep, setOtpStep] = useState(1); // 1 = request otp, 2 = verify otp
  const [otpForm, setOtpForm] = useState({ credentialId: '', phoneNumber: '', otp: '' });

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

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.requestOtp({ credentialId: otpForm.credentialId, phoneNumber: otpForm.phoneNumber });
      toast.success(res.data.otp ? `Demo OTP: ${res.data.otp}` : 'OTP sent to your mobile number!', { duration: 6000 });
      setOtpStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp({ credentialId: otpForm.credentialId, otp: otpForm.otp });
      const { data } = res.data;
      login({ id: data.id, username: data.username, email: data.email, role: data.role }, data.token);
      toast.success(`Welcome back, ${data.username}! ⚡`);
      navigate('/team-alerts');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
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
            <div className="auth-logo" style={{ marginBottom: '1.5rem' }}>
              <div className="auth-logo-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <polygon points="18,2 6,18 15,18 14,30 26,14 17,14" fill="#3b82f6" />
                  <polygon points="18,2 6,18 15,18 14,30 26,14 17,14" fill="url(#bolt-grad)" />
                  <defs>
                    <linearGradient id="bolt-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <div className="auth-logo-name">SmartGrid</div>
                <div className="auth-logo-sub">Grid Intelligence Platform</div>
              </div>
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
            
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
              <p style={{ margin: '0' }}><strong>Electricity Officer:</strong> electricity_officer / Admin@123</p>
            </div>
          </div>
        </div>

        {/* Right Panel – Form */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-form-content">
              <div className="auth-form-header">
                <h2>Welcome back</h2>
                <p>Select your role to access the platform</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                  type="button" 
                  className={`btn ${loginType === 'officer' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '8px', fontSize: '14px' }}
                  onClick={() => setLoginType('officer')}
                >
                  <i className="bi bi-person-badge"></i> Officer Login
                </button>
                <button 
                  type="button" 
                  className={`btn ${loginType === 'maintenance' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '8px', fontSize: '14px' }}
                  onClick={() => setLoginType('maintenance')}
                >
                  <i className="bi bi-tools"></i> Maintenance Login
                </button>
              </div>

              {loginType === 'officer' && (
                <>
                  <button
                    type="button"
                    className="auth-demo-btn"
                    onClick={() => {
                      setLoginForm({ usernameOrEmail: 'electricity_officer', password: 'Admin@123' });
                      toast.success('Officer credentials filled!');
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    Use Demo Officer Credentials
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
                          placeholder="electricity_officer"
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
                </>
              )}

              {loginType === 'maintenance' && (
                <>
                  {otpStep === 1 ? (
                    <form onSubmit={handleRequestOtp}>
                      <div className="auth-field">
                        <label className="auth-label">Credential ID</label>
                        <div className="auth-input-wrap">
                          <span className="auth-input-icon">
                            <i className="bi bi-hash"></i>
                          </span>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="e.g. MTM-1"
                            value={otpForm.credentialId}
                            onChange={e => setOtpForm({ ...otpForm, credentialId: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="auth-field">
                        <label className="auth-label">Phone Number</label>
                        <div className="auth-input-wrap">
                          <span className="auth-input-icon">
                            <i className="bi bi-telephone"></i>
                          </span>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="e.g. +919344255537"
                            value={otpForm.phoneNumber}
                            onChange={e => setOtpForm({ ...otpForm, phoneNumber: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? (
                          <><span className="auth-spinner" /> Sending OTP...</>
                        ) : (
                          <><span>💬</span> Send OTP via SMS</>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp}>
                      <div className="auth-field">
                        <label className="auth-label">Enter 6-Digit OTP</label>
                        <div className="auth-input-wrap">
                          <span className="auth-input-icon">
                            <i className="bi bi-shield-lock"></i>
                          </span>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="••••••"
                            value={otpForm.otp}
                            onChange={e => setOtpForm({ ...otpForm, otp: e.target.value })}
                            required
                            maxLength={6}
                            style={{ letterSpacing: '4px', fontSize: '16px' }}
                          />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Sent to {otpForm.phoneNumber}</span>
                        <button type="button" onClick={() => setOtpStep(1)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }}>Change Number</button>
                      </div>

                      <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? (
                          <><span className="auth-spinner" /> Verifying...</>
                        ) : (
                          <><span>✅</span> Verify & Login</>
                        )}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>

            <div className="auth-footer">
              © {new Date().getFullYear()} SmartGrid Inc. · Privacy · Terms
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
