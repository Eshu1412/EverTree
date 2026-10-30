import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPieChart, FiUsers, FiShield, FiLogOut, FiRefreshCw, 
  FiHome, FiGrid, FiSun, FiMoon, FiSettings, 
  FiChevronLeft, FiChevronRight, FiMaximize2, FiBell 
} from 'react-icons/fi';

import AdminLogin from './AdminLogin';
import AdminOverview from './AdminOverview';
import AdminLeads from './AdminLeads';
import AdminStaff from './AdminStaff';
import AdminSettings from './AdminSettings';
import AdminSnackbar from './AdminSnackbar';

import './AdminDashboard.css';

export default function AdminDashboard({ onNavigateHome }) {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'leads' | 'staff' | 'settings'
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [serviceFilterTarget, setServiceFilterTarget] = useState('all');

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('adminTheme') || 'light';
  });

  // Snackbars state
  const [snackbars, setSnackbars] = useState([]);

  const showSnackbar = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setSnackbars(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setSnackbars(prev => prev.filter(s => s.id !== id));
    }, 4000);
  };

  const removeSnackbar = (id) => {
    setSnackbars(prev => prev.filter(s => s.id !== id));
  };

  // Synchronize data-theme to document.documentElement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [theme]);

  // Always clear any stored session on mount so that every visit to #admin asks for login
  useEffect(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('adminTheme', newTheme);
    showSnackbar(`Switched to ${newTheme === 'light' ? 'Light' : 'Dark'} Mode`, 'info');
  };

  const fetchStats = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, fetchStats]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setUser(null);
  };

  const handleReturnHome = () => {
    handleLogout();
    if (onNavigateHome) {
      onNavigateHome();
    }
  };

  const handleFilterByService = (service) => {
    setServiceFilterTarget(service);
    setActiveTab('leads');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      showSnackbar('Entered Fullscreen Mode', 'info');
    } else {
      document.exitFullscreen();
    }
  };

  if (!user) {
    return (
      <AdminLogin 
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigateHome={handleReturnHome}
        onLoginSuccess={(u) => {
          setUser(u);
          showSnackbar(`Welcome back, ${u.username}!`, 'success');
        }} 
      />
    );
  }

  return (
    <div className="admin-wrapper" data-theme={theme}>
      {/* Material Toast / Snackbar Component */}
      <AdminSnackbar snackbars={snackbars} onClose={removeSnackbar} />

      {/* Collapsible Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand-group">
            <div className="admin-logo-sq">
              <img src="/evertree-symbol.svg" alt="EverTree Solutions" />
            </div>
            {!sidebarCollapsed && (
              <div className="admin-brand-info">
                <div className="admin-brand-name">
                  EverTree <span>Solutions</span>
                </div>
                <div className="admin-brand-badge">Command Center</div>
              </div>
            )}
          </div>

          <button 
            className="admin-sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        <nav className="admin-nav">
          {!sidebarCollapsed && <span className="admin-nav-section-label">Core Modules</span>}

          <button
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            title="Dashboard Overview"
          >
            <FiPieChart className="admin-nav-icon" />
            {!sidebarCollapsed && <span>Overview</span>}
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => { setActiveTab('leads'); setServiceFilterTarget('all'); }}
            title="Leads Database"
          >
            <FiGrid className="admin-nav-icon" />
            {!sidebarCollapsed && (
              <>
                <span>Leads Hub</span>
                {stats?.total_leads ? <span className="admin-nav-badge">{stats.total_leads}</span> : null}
              </>
            )}
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
            title="Team & Access Control"
          >
            <FiUsers className="admin-nav-icon" />
            {!sidebarCollapsed && <span>Team & Access</span>}
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            title="System Diagnostics & Settings"
          >
            <FiSettings className="admin-nav-icon" />
            {!sidebarCollapsed && <span>System Settings</span>}
          </button>

          <div style={{ height: '1px', background: 'var(--md-outline-variant)', margin: '0.8rem 0' }} />

          {!sidebarCollapsed && <span className="admin-nav-section-label">Quick Links</span>}

          <button className="admin-nav-item" onClick={handleReturnHome} title="Return to Consumer Site">
            <FiHome className="admin-nav-icon" />
            {!sidebarCollapsed && <span>Public Website</span>}
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-profile">
            <div className="admin-avatar">
              {user.username ? user.username.charAt(0).toUpperCase() : 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="admin-user-info">
                <div className="admin-user-name">{user.username}</div>
                <div className="admin-user-role">{user.role === 'admin' ? 'Super Admin' : 'Staff Member'}</div>
              </div>
            )}
          </div>

          <button className="admin-logout-btn" onClick={handleLogout} title="Sign Out">
            <FiLogOut /> {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace Content */}
      <main className="admin-main">
        {/* Sticky Header */}
        <header className="admin-header">
          <div className="admin-header-title-group">
            <h1>
              {activeTab === 'overview' && 'Analytics & Operations Hub'}
              {activeTab === 'leads' && 'Consumer Quote Directory & Kanban'}
              {activeTab === 'staff' && 'Team Access & Permissions'}
              {activeTab === 'settings' && 'Platform Diagnostics & Controls'}
            </h1>
          </div>

          <div className="admin-header-actions">
            {/* System Status Badge */}
            <div className="admin-live-badge">
              <span className="admin-live-dot" />
              <span>Live Engine</span>
            </div>

            {/* Refresh Data */}
            <button
              className="admin-icon-btn"
              onClick={() => { fetchStats(); showSnackbar('Dashboard data refreshed', 'info'); }}
              disabled={refreshing}
              title="Refresh Dashboard Data"
            >
              <FiRefreshCw style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>

            {/* Fullscreen Toggle */}
            <button
              className="admin-icon-btn"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
            >
              <FiMaximize2 />
            </button>

            {/* Theme Toggle Button */}
            <button 
              className="admin-icon-btn" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <FiMoon style={{ color: '#6366f1' }} />
              ) : (
                <FiSun style={{ color: '#f59e0b' }} />
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Content Container */}
        <div className="admin-content-container">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <AdminOverview
                key="overview"
                stats={stats}
                onNavigateToLeads={() => { setActiveTab('leads'); setServiceFilterTarget('all'); }}
                onFilterByService={handleFilterByService}
              />
            )}

            {activeTab === 'leads' && (
              <AdminLeads
                key={`leads-${serviceFilterTarget}`}
                initialServiceFilter={serviceFilterTarget}
                onUpdateRefresh={fetchStats}
                onShowSnackbar={showSnackbar}
              />
            )}

            {activeTab === 'staff' && (
              <AdminStaff
                key="staff"
                onShowSnackbar={showSnackbar}
              />
            )}

            {activeTab === 'settings' && (
              <AdminSettings
                key="settings"
                onShowSnackbar={showSnackbar}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
