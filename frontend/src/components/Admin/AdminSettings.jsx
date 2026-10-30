import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FiServer, FiCpu, FiHardDrive, FiCheckCircle, 
  FiRefreshCw, FiDownload, FiUpload, FiShield, 
  FiSliders, FiActivity, FiDatabase, FiFileText, FiClock,
  FiPhoneCall, FiMessageSquare, FiEye, FiSave, FiCheck, FiSettings,
  FiX, FiAlertTriangle, FiPhone, FiRotateCcw, FiSlash, FiImage
} from 'react-icons/fi';
import { 
  FaHeartbeat, FaCar, FaTools, FaHandHoldingUsd, 
  FaGavel, FaPlane, FaShieldAlt 
} from 'react-icons/fa';
import { DEFAULT_CONTACT_CONFIG, SERVICE_VERTICALS } from '../../utils/serviceContact';
import ContactRedirectModal from '../ContactRedirectModal';

export default function AdminSettings({ onShowSnackbar }) {
  const [health, setHealth] = useState({ status: 'healthy', latency: 42 });
  const [pinging, setPinging] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [lastBackupInfo, setLastBackupInfo] = useState(null);
  const fileInputRef = useRef(null);

  const [activeVerticals, setActiveVerticals] = useState({
    'Health Insurance': true,
    'Home Improvement': true,
    'Auto & Home Insurance': true,
    'Debt Relief': true,
    'Legal Help': true,
    'Medicare': true,
    'Flight Booking': true
  });

  const SERVICE_ICONS = {
    'Health Insurance': { icon: FaHeartbeat, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', cat: 'Healthcare' },
    'Medicare': { icon: FaShieldAlt, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)', cat: 'Seniors' },
    'Auto & Home Insurance': { icon: FaCar, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', cat: 'Insurance' },
    'Home Improvement': { icon: FaTools, color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)', cat: 'Home Services' },
    'Debt Relief': { icon: FaHandHoldingUsd, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', cat: 'Debt & Credit' },
    'Legal Help': { icon: FaGavel, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', cat: 'Legal Desk' },
    'Flight Booking': { icon: FaPlane, color: '#0B6B5C', bg: 'rgba(11, 107, 92, 0.12)', cat: 'Aviation Desk' },
  };

  // Contact Us & Redirection Config State
  const [contactConfig, setContactConfig] = useState(() => {
    try {
      const cached = localStorage.getItem('contact_config');
      return cached ? JSON.parse(cached) : DEFAULT_CONTACT_CONFIG;
    } catch {
      return DEFAULT_CONTACT_CONFIG;
    }
  });
  const [savingContact, setSavingContact] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewService, setPreviewService] = useState('Health Insurance');

  const checkPing = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const latency = Math.round(performance.now() - start);
      setHealth({ ...data, latency });
      if (onShowSnackbar) onShowSnackbar(`Server health check passed: ${latency}ms latency`, 'success');
    } catch (err) {
      setHealth({ status: 'error', latency: -1 });
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    checkPing();
    const fetchContactSettings = async () => {
      try {
        const res = await fetch('/api/settings/contact');
        if (res.ok) {
          const data = await res.json();
          const mergedServices = { ...(DEFAULT_CONTACT_CONFIG.services || {}), ...(data.services || {}) };
          const fullConfig = { ...data, services: mergedServices };
          setContactConfig(fullConfig);
          localStorage.setItem('contact_config', JSON.stringify(fullConfig));
        }
      } catch (err) {
        console.warn('Could not fetch remote contact config, using local cache', err);
      }
    };
    fetchContactSettings();
  }, []);

  const handleSaveContactConfig = async (e) => {
    if (e) e.preventDefault();
    setSavingContact(true);
    try {
      const res = await fetch('/api/admin/settings/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactConfig)
      });
      const data = await res.json();
      if (res.ok) {
        const updatedConfig = data.config || contactConfig;
        setContactConfig(updatedConfig);
        localStorage.setItem('contact_config', JSON.stringify(updatedConfig));
        window.dispatchEvent(new CustomEvent('contact_config_updated', { detail: updatedConfig }));
        if (onShowSnackbar) {
          onShowSnackbar('Contact Us configuration & individual service hotlines saved!', 'success');
        }
      } else {
        throw new Error(data.detail || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Save contact config error:', err);
      localStorage.setItem('contact_config', JSON.stringify(contactConfig));
      if (onShowSnackbar) {
        onShowSnackbar('Saved contact configuration locally', 'info');
      }
    } finally {
      setSavingContact(false);
    }
  };

  const toggleVertical = (v) => {
    setActiveVerticals(prev => {
      const updated = { ...prev, [v]: !prev[v] };
      if (onShowSnackbar) onShowSnackbar(`Vertical "${v}" intake ${updated[v] ? 'Enabled' : 'Paused'}`, 'info');
      return updated;
    });
  };

  // Real Database Backup Exporter
  const handleBackupExport = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/admin/backup');
      if (!res.ok) throw new Error('Backup generation failed');
      const backupData = await res.json();
      
      // Trigger clean file download directly from in-memory backupData JSON
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `evertree_turso_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 30000);

      setLastBackupInfo({
        date: new Date().toLocaleTimeString(),
        totalLeads: backupData.stats?.total_leads || 0,
        totalFlights: backupData.stats?.total_flights || 0,
        totalUsers: backupData.stats?.total_users || 0,
        backend: backupData.database_backend
      });

      if (onShowSnackbar) {
        onShowSnackbar(`Database backup downloaded (${backupData.stats?.total_leads || 0} leads, ${backupData.stats?.total_flights || 0} flights)`, 'success');
      }
    } catch (err) {
      console.error('Backup failed:', err);
      if (onShowSnackbar) onShowSnackbar('Failed to download system backup', 'error');
    } finally {
      setDownloading(false);
    }
  };

  // Restore Database Backup Handler
  const handleFileRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    try {
      const fileText = await file.text();
      const backupJson = JSON.parse(fileText);

      if (!backupJson.leads || !Array.isArray(backupJson.leads)) {
        throw new Error('Invalid backup file: Missing leads array');
      }

      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupJson)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Restore failed');

      if (onShowSnackbar) {
        const flightText = data.flights_restored ? ` and ${data.flights_restored} flights` : '';
        onShowSnackbar(`Successfully restored ${data.leads_restored} lead records${flightText} to Turso!`, 'success');
      }
    } catch (err) {
      console.error('Restore error:', err);
      if (onShowSnackbar) onShowSnackbar(`Restore failed: ${err.message}`, 'error');
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleServicePhoneChange = (serviceTitle, value) => {
    setContactConfig(prev => ({
      ...prev,
      services: {
        ...(prev.services || {}),
        [serviceTitle]: value
      }
    }));
  };

  const handleSetAllDefault = () => {
    const defaultServices = {};
    SERVICE_VERTICALS.forEach(svc => {
      defaultServices[svc.title] = '+18558312264';
    });
    setContactConfig(prev => ({
      ...prev,
      services: defaultServices
    }));
    if (onShowSnackbar) onShowSnackbar('All 7 services reset to default hotline (+18558312264)', 'info');
  };

  const handleClearAll = () => {
    const emptyServices = {};
    SERVICE_VERTICALS.forEach(svc => {
      emptyServices[svc.title] = '';
    });
    setContactConfig(prev => ({
      ...prev,
      services: emptyServices
    }));
    if (onShowSnackbar) onShowSnackbar('Cleared all hotlines. The contact window is now suppressed for all services until numbers are entered.', 'info');
  };

  const servicesMap = contactConfig.services || {};
  const totalServices = SERVICE_VERTICALS.length;
  const activeCount = SERVICE_VERTICALS.filter(s => (servicesMap[s.title] || '').trim().length > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Server Status & Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3 className="admin-panel-title">
                  <FiServer style={{ color: 'var(--md-primary)' }} />
                  System Health & API Telemetry
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)' }}>
                  Real-time server infrastructure & cloud database connectivity
                </span>
              </div>

              <button className="admin-btn-secondary" onClick={checkPing} disabled={pinging}>
                <FiRefreshCw style={{ animation: pinging ? 'spin 1s linear infinite' : 'none' }} />
                {pinging ? 'Pinging...' : 'Ping Server'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="admin-detail-item">
                <div className="admin-detail-label">API Gateway Status</div>
                <div className="admin-detail-value" style={{ color: health.status === 'healthy' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FiCheckCircle /> {health.status === 'healthy' ? 'Operational' : 'Degraded'}
                </div>
              </div>

              <div className="admin-detail-item">
                <div className="admin-detail-label">API Latency</div>
                <div className="admin-detail-value" style={{ color: 'var(--md-primary)' }}>
                  {health.latency} ms
                </div>
              </div>

              <div className="admin-detail-item">
                <div className="admin-detail-label">Cloud Database</div>
                <div className="admin-detail-value" style={{ color: '#0B6B5C', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FiDatabase /> Turso (AWS Mumbai)
                </div>
              </div>

              <div className="admin-detail-item">
                <div className="admin-detail-label">TCPA Compliance</div>
                <div className="admin-detail-value" style={{ color: '#10b981' }}>
                  ActiveProspect API Live
                </div>
              </div>
            </div>

            {/* Real Backup & Restore Engine */}
            <div style={{ borderTop: '1px solid var(--md-outline-variant)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--md-on-surface)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FiDatabase style={{ color: '#0B6B5C' }} /> Full Database & System Backup
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--md-on-surface-variant)' }}>
                    Export or restore complete Turso Cloud records, schema, and lead certificates
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button 
                    className="admin-btn-secondary" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={restoring}
                    title="Upload and restore a previous JSON backup"
                  >
                    <FiUpload /> {restoring ? 'Restoring...' : 'Restore Backup'}
                  </button>

                  <button 
                    className="admin-btn-primary" 
                    onClick={handleBackupExport}
                    disabled={downloading}
                    title="Export complete database JSON dump"
                  >
                    <FiDownload /> {downloading ? 'Exporting...' : 'Download Backup'}
                  </button>
                </div>
              </div>

              {/* Hidden file input for restore */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json,application/json"
                onChange={handleFileRestore}
              />

              {lastBackupInfo && (
                <div style={{ background: 'var(--md-primary-container)', padding: '0.75rem 1rem', borderRadius: '10px', marginTop: '0.85rem', fontSize: '0.82rem', color: 'var(--md-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiClock />
                  <span>
                    Last backup exported at <strong>{lastBackupInfo.date}</strong> containing <strong>{lastBackupInfo.totalLeads} leads</strong> and <strong>{lastBackupInfo.totalFlights} flights</strong> from {lastBackupInfo.backend}.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Service Intake Toggles */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">
                <FiSliders style={{ color: 'var(--md-tertiary)' }} />
                Vertical Quote Intake Controls
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)' }}>
                Enable or pause incoming lead intake per vertical
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.entries(activeVerticals).map(([vertical, isActive]) => (
              <div 
                key={vertical} 
                className="admin-funnel-stage"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleVertical(vertical)}
              >
                <div className="admin-funnel-left">
                  <span 
                    className="admin-funnel-badge-dot" 
                    style={{ backgroundColor: isActive ? '#10b981' : '#94a3b8' }} 
                  />
                  <div>
                    <div className="admin-funnel-title">{vertical}</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--md-on-surface-variant)' }}>
                      {isActive ? 'Accepting new consumer quotes' : 'Intake paused (Maintenance)'}
                    </span>
                  </div>
                </div>

                <span className={`status-pill ${isActive ? 'qualified' : 'closed'}`}>
                  {isActive ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Full-Width Section: Official Brand & Logo Assets */}
        <div className="admin-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="admin-panel-header">
            <div>
              <h3 className="admin-panel-title">
                <FiImage style={{ color: 'var(--md-primary)' }} />
                Official EverTree Brand &amp; Logo Asset Pack
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)' }}>
                Active multi-format logos deployed from EverTree-Logo-Pack
              </span>
            </div>
            <a
              href="/evertree-logo.svg"
              download="evertree-logo.svg"
              className="admin-btn-secondary"
              title="Download Master SVG"
              style={{ textDecoration: 'none' }}
            >
              <FiDownload /> Download Master SVG
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
            {/* Symbol Preview */}
            <div style={{ background: 'var(--md-surface-container-high)', border: '1px solid var(--md-outline-variant)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: '#ffffff', borderRadius: '14px', border: '1.5px solid #DDE7E3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', boxShadow: '0 4px 12px rgba(3, 54, 58, 0.08)', marginBottom: '0.85rem' }}>
                <img src="/evertree-symbol.svg" alt="EverTree Symbol" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <strong style={{ color: 'var(--md-on-surface)', fontSize: '0.95rem' }}>Symbol Mark (Vector &amp; Transparent)</strong>
              <span style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.78rem', margin: '0.25rem 0 0.85rem' }}>Used in Navbar, Modals, Favicons (16px - 2048px)</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href="/evertree-symbol.svg" target="_blank" rel="noreferrer" className="status-pill qualified" style={{ textDecoration: 'none' }}>SVG</a>
                <a href="/logos/1-Symbol-Only/evertree-symbol-512x512.png" target="_blank" rel="noreferrer" className="status-pill qualified" style={{ textDecoration: 'none' }}>512px PNG</a>
                <a href="/logos/1-Symbol-Only/evertree-symbol-2048x2048.png" target="_blank" rel="noreferrer" className="status-pill qualified" style={{ textDecoration: 'none' }}>2048px Master</a>
              </div>
            </div>

            {/* Full Logo Preview */}
            <div style={{ background: 'var(--md-surface-container-high)', border: '1px solid var(--md-outline-variant)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '100%', height: '80px', background: '#ffffff', borderRadius: '14px', border: '1.5px solid #DDE7E3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', boxShadow: '0 4px 12px rgba(3, 54, 58, 0.08)', marginBottom: '0.85rem' }}>
                <img src="/evertree-logo.svg" alt="EverTree Full Logo" style={{ maxWidth: '180px', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <strong style={{ color: 'var(--md-on-surface)', fontSize: '0.95rem' }}>Full Signature Logo</strong>
              <span style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.78rem', margin: '0.25rem 0 0.85rem' }}>Primary horizontal &amp; vertical branded lockup</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href="/evertree-logo.svg" target="_blank" rel="noreferrer" className="status-pill qualified" style={{ textDecoration: 'none' }}>SVG Vector</a>
                <a href="/logos/2-Full-Logo/evertree-full-512x512.png" target="_blank" rel="noreferrer" className="status-pill qualified" style={{ textDecoration: 'none' }}>512px PNG</a>
                <a href="/logos/2-Full-Logo/evertree-full-2048x2048.png" target="_blank" rel="noreferrer" className="status-pill qualified" style={{ textDecoration: 'none' }}>2048px Master</a>
              </div>
            </div>

            {/* Website & Social Preview */}
            <div style={{ background: 'var(--md-surface-container-high)', border: '1px solid var(--md-outline-variant)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '100%', height: '80px', background: '#ffffff', borderRadius: '14px', border: '1.5px solid #DDE7E3', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '0.85rem' }}>
                <img src="/og-social-share-1200x630.png" alt="OpenGraph Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <strong style={{ color: 'var(--md-on-surface)', fontSize: '0.95rem' }}>Website &amp; Social Share (OG 1200x630)</strong>
              <span style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.78rem', margin: '0.25rem 0 0.85rem' }}>Favicons, Touch Icons &amp; Social Previews</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href="/favicon.ico" target="_blank" rel="noreferrer" className="status-pill qualified" style={{ textDecoration: 'none' }}>favicon.ico</a>
                <a href="/apple-touch-icon-180x180.png" target="_blank" rel="noreferrer" className="status-pill qualified" style={{ textDecoration: 'none' }}>Apple Touch</a>
                <a href="/og-social-share-1200x630.png" target="_blank" rel="noreferrer" className="status-pill qualified" style={{ textDecoration: 'none' }}>OG Share PNG</a>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Section: Individual Service Hotlines & Lead Redirection */}
        <div className="admin-contact-panel">
          <div className="admin-contact-header-row">
            <div className="admin-contact-title-area">
              <h3 className="admin-contact-title">
                <FiPhoneCall style={{ color: 'var(--md-primary)' }} />
                Direct Contact Hotlines & Lead Redirection
              </h3>
              <p className="admin-contact-subtitle">
                Configure individual telephone hotlines for each service vertical. 
                <strong> Important:</strong> If a service phone number is left blank, the on-screen contact window will <strong>NOT display</strong> when a user submits a form for that service.
              </p>
            </div>

            <div className="admin-contact-actions">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--md-on-surface-variant)', fontWeight: 600 }}>Preview For:</span>
                <select
                  className="admin-select"
                  style={{ padding: '0.45rem 2rem 0.45rem 0.75rem', fontSize: '0.82rem' }}
                  value={previewService}
                  onChange={(e) => setPreviewService(e.target.value)}
                >
                  {SERVICE_VERTICALS.map(s => (
                    <option key={s.id} value={s.title}>{s.title}</option>
                  ))}
                </select>
              </div>

              <button 
                type="button" 
                className="admin-btn-secondary" 
                onClick={() => {
                  const phoneForPreview = (contactConfig.services?.[previewService] || '').trim();
                  if (!phoneForPreview) {
                    if (onShowSnackbar) {
                      onShowSnackbar(`"${previewService}" has no phone number set. In live mode the contact window will NOT display.`, 'warning');
                    }
                  }
                  setPreviewOpen(true);
                }}
                title="Preview the customer on-screen message window for the selected service"
              >
                <FiEye /> Preview Window
              </button>

              <button 
                type="button" 
                className="admin-btn-primary" 
                onClick={handleSaveContactConfig}
                disabled={savingContact}
              >
                <FiSave /> {savingContact ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveContactConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* SUB-SECTION 1: Individual Service Hotline Grid */}
            <div className="admin-services-hotlines-section">
              <div className="admin-services-toolbar">
                <div className="admin-services-stats">
                  <span>Per-Service Numbers:</span>
                  <span className={`status-pill ${activeCount === totalServices ? 'qualified' : activeCount > 0 ? 'contacted' : 'closed'}`}>
                    {activeCount} of {totalServices} Active
                  </span>
                  {activeCount < totalServices && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--md-on-surface-variant)' }}>
                      ({totalServices - activeCount} service{totalServices - activeCount > 1 ? 's' : ''} suppressed)
                    </span>
                  )}
                </div>

                <div className="admin-services-tools-btn-group">
                  <button
                    type="button"
                    className="admin-pill-btn"
                    onClick={handleSetAllDefault}
                    title="Populate +18558312264 across all 7 services"
                  >
                    <FiRotateCcw /> Set All to +18558312264
                  </button>
                  <button
                    type="button"
                    className="admin-pill-btn"
                    onClick={handleClearAll}
                    title="Clear all phone numbers to suppress modal across all services"
                  >
                    <FiSlash /> Clear All
                  </button>
                </div>
              </div>

              {/* 7 Services Grid */}
              <div className="admin-services-grid">
                {SERVICE_VERTICALS.map(svc => {
                  const currentPhone = contactConfig.services?.[svc.title] ?? '';
                  const hasPhone = currentPhone.trim().length > 0;
                  const iconMeta = SERVICE_ICONS[svc.title] || { icon: FiPhone, color: 'var(--md-primary)', bg: 'var(--md-primary-container)', cat: svc.tag };
                  const IconComp = iconMeta.icon;

                  return (
                    <div 
                      key={svc.id} 
                      className={`admin-service-card ${hasPhone ? 'active-state' : 'disabled-state'}`}
                    >
                      <div className="admin-service-card-header">
                        <div className="admin-service-title-wrap">
                          <div 
                            className="admin-service-icon-box"
                            style={{ background: iconMeta.bg, color: iconMeta.color }}
                          >
                            <IconComp />
                          </div>
                          <div>
                            <h4 className="admin-service-name">{svc.title}</h4>
                            <span className="admin-service-tag">{iconMeta.cat}</span>
                          </div>
                        </div>

                        <span className={`admin-service-badge ${hasPhone ? 'active' : 'disabled'}`}>
                          {hasPhone ? '● Active' : '○ Suppressed'}
                        </span>
                      </div>

                      <div className="admin-service-input-wrap">
                        <FiPhoneCall className="admin-input-icon" style={{ color: hasPhone ? iconMeta.color : 'var(--md-on-surface-variant)' }} />
                        <input
                          type="text"
                          id={`service-phone-input-${svc.id}`}
                          name={`service-phone-${svc.id}`}
                          className="admin-service-input"
                          placeholder="e.g. +18558312264 (leave blank to hide)"
                          value={currentPhone}
                          onChange={(e) => handleServicePhoneChange(svc.title, e.target.value)}
                        />
                        {hasPhone && (
                          <button
                            type="button"
                            id={`clear-btn-${svc.id}`}
                            className="admin-service-clear-btn"
                            title="Clear this service number"
                            onClick={() => handleServicePhoneChange(svc.title, '')}
                          >
                            <FiX />
                          </button>
                        )}
                      </div>

                      <div className={`admin-service-caption ${hasPhone ? 'active' : 'disabled'}`}>
                        {hasPhone ? (
                          <>✓ Modal will display <strong>{currentPhone.trim()}</strong> upon form submission.</>
                        ) : (
                          <>⚠️ No number set — on-screen contact modal will <strong>NOT display</strong>.</>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SUB-SECTION 2: Global Appearance & Timing Settings */}
            <div className="admin-contact-global-grid">
              <div className="admin-contact-subcard">
                <div className="admin-contact-subcard-title">
                  <FiMessageSquare style={{ color: 'var(--md-primary)' }} />
                  Message Window Copy & Headline
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label" style={{ fontWeight: 700, color: 'var(--md-on-surface)' }}>
                    Popup Window Headline
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px' }}
                    placeholder="e.g. Speak With an Advisor Right Now"
                    value={contactConfig.modal_title || ''}
                    onChange={(e) => setContactConfig({ ...contactConfig, modal_title: e.target.value })}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--md-on-surface-variant)' }}>
                    Headline displayed inside the customer message popup window.
                  </span>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label" style={{ fontWeight: 700, color: 'var(--md-on-surface)' }}>
                    Customer Notice Message
                  </label>
                  <textarea
                    rows="3"
                    className="admin-input"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', resize: 'vertical' }}
                    placeholder="Enter reassurance text displayed in the message window..."
                    value={contactConfig.modal_message || ''}
                    onChange={(e) => setContactConfig({ ...contactConfig, modal_message: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-contact-subcard">
                <div className="admin-contact-subcard-title">
                  <FiClock style={{ color: 'var(--md-primary)' }} />
                  Redirection Timer & Master Switch
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label" style={{ fontWeight: 700, color: 'var(--md-on-surface)' }}>
                    Auto-Redirect Timer (Seconds)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="number"
                      min="2"
                      max="30"
                      className="admin-input"
                      style={{ width: '90px', padding: '0.65rem 0.75rem', borderRadius: '10px' }}
                      value={contactConfig.auto_redirect_seconds || 5}
                      onChange={(e) => setContactConfig({ ...contactConfig, auto_redirect_seconds: Number(e.target.value) })}
                      disabled={!contactConfig.auto_redirect}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--md-on-surface)' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(contactConfig.auto_redirect)}
                        onChange={(e) => setContactConfig({ ...contactConfig, auto_redirect: e.target.checked })}
                      />
                      Enable Auto-Redirect Countdown Bar
                    </label>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--md-on-surface-variant)', marginTop: '0.35rem' }}>
                    When enabled, an interactive countdown bar automatically triggers the phone dialer after expiration.
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--md-surface-container-high)', borderRadius: '12px', border: '1px solid var(--md-outline-variant)', marginTop: 'auto' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--md-on-surface)' }}>
                      Master Modal Activation
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--md-on-surface-variant)' }}>
                      Global toggle for all on-screen redirection modals.
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`status-pill ${contactConfig.enabled ? 'qualified' : 'closed'}`}
                    style={{ cursor: 'pointer', padding: '0.4rem 1rem', fontSize: '0.82rem' }}
                    onClick={() => setContactConfig({ ...contactConfig, enabled: !contactConfig.enabled })}
                  >
                    {contactConfig.enabled ? 'GLOBAL ON' : 'GLOBAL OFF'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Live Preview Modal */}
      {previewOpen && (
        <ContactRedirectModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          config={contactConfig}
          leadData={{
            service: previewService,
            name: 'Preview Customer',
            phone: contactConfig.services?.[previewService] || contactConfig.phone_number
          }}
          overridePhone={contactConfig.services?.[previewService] || ''}
        />
      )}
    </motion.div>
  );
}
