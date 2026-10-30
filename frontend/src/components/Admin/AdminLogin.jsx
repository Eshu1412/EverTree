import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiUser, FiArrowRight, FiShield, FiAlertCircle, FiSun, FiMoon, FiArrowLeft } from 'react-icons/fi';
import './AdminDashboard.css';

export default function AdminLogin({ onLoginSuccess, theme = 'light', onToggleTheme, onNavigateHome }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed. Please check credentials.');
      }

      // No persistent localStorage auto-login: user must log in every time #admin is visited
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container" data-theme={theme}>
      {/* Top right theme toggle */}
      {onToggleTheme && (
        <div className="admin-login-theme-toggle">
          <button 
            className="admin-theme-toggle-btn" 
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <>
                <FiMoon className="admin-theme-icon" style={{ color: '#0B6B5C' }} />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <FiSun className="admin-theme-icon" style={{ color: '#E8B84A' }} />
                <span>Light Mode</span>
              </>
            )}
          </button>
        </div>
      )}

      <motion.div
        className="admin-login-box"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="admin-brand-header">
          <div className="admin-logo-sq">
            <img src="/evertree-symbol.svg" alt="EverTree Solutions" />
          </div>
          <div className="admin-brand-title">
            EverTree <span>Solutions</span>
          </div>
        </div>

        <div className="admin-login-badge">
          Admin Portal Access
        </div>
        
        <p className="admin-login-subtitle">
          Secure sign-in for platform managers and quote specialists.
        </p>

        {error && (
          <div className="admin-error-banner">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">Username</label>
            <div className="admin-input-wrapper">
              <FiUser className="admin-input-icon" />
              <input
                type="text"
                className="admin-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Password</label>
            <div className="admin-input-wrapper">
              <FiLock className="admin-input-icon" />
              <input
                type="password"
                className="admin-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : (
              <>
                Sign In to Dashboard <FiArrowRight />
              </>
            )}
          </button>
        </form>

        {onNavigateHome && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              className="admin-btn-secondary admin-login-back-btn"
              style={{ border: 'none', background: 'transparent', color: 'var(--md-secondary)', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              onClick={onNavigateHome}
            >
              <FiArrowLeft /> Return to Consumer Site
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
