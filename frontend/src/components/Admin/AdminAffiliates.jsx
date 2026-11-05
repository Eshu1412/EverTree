import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiDownload, FiTrash2, FiEye, 
  FiX, FiSave, FiCheck, FiMail, FiPhone, 
  FiLink, FiCheckSquare, FiSquare, FiRefreshCw,
  FiArrowUp, FiArrowDown, FiLayers, FiTag, FiClock,
  FiAlertTriangle, FiCopy, FiExternalLink, FiLock, FiUnlock
} from 'react-icons/fi';

const AFFILIATE_STATUSES = [
  { value: 'pending', label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { value: 'approved', label: 'Approved', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' }
];

export default function AdminAffiliates({ onUpdateRefresh, onShowSnackbar }) {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('25');
  const [totalPages, setTotalPages] = useState(1);
  const [totalAffiliates, setTotalAffiliates] = useState(0);

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Multi-Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Form route blocked state
  const [routeBlocked, setRouteBlocked] = useState(false);
  const [togglingRoute, setTogglingRoute] = useState(false);

  // Inspection & Edit Modal
  const [activeAffiliate, setActiveAffiliate] = useState(null);
  const [affiliateToDelete, setAffiliateToDelete] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [editStatus, setEditStatus] = useState('pending');

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    try {
      const perPageVal = pageSize === 'all' ? '0' : pageSize;
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        page: page.toString(),
        per_page: perPageVal,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      const res = await fetch(`/api/admin/affiliates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data.affiliates || []);
        setTotalPages(data.total_pages || 1);
        setTotalAffiliates(data.total || 0);
        if (typeof data.form_blocked === 'boolean') {
          setRouteBlocked(data.form_blocked);
        }
      }
    } catch (err) {
      console.error('Failed to fetch affiliates:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  // Handle route block/unblock toggle
  const handleToggleRoute = async () => {
    setTogglingRoute(true);
    const newBlockedState = !routeBlocked;
    try {
      const res = await fetch('/api/admin/settings/affiliate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: newBlockedState })
      });
      const data = await res.json();
      if (res.ok) {
        setRouteBlocked(newBlockedState);
        onShowSnackbar(
          newBlockedState
            ? 'Affiliate signup route is now BLOCKED (signups paused).'
            : 'Affiliate signup route is now UNBLOCKED (accepting signups).',
          newBlockedState ? 'warning' : 'success'
        );
      } else {
        throw new Error(data.detail || 'Failed to update route setting');
      }
    } catch (err) {
      onShowSnackbar(err.message, 'error');
    } finally {
      setTogglingRoute(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/affiliate/signup?q=8FS918X`;
    navigator.clipboard.writeText(url);
    onShowSnackbar('Copied affiliate route URL to clipboard!', 'info');
  };

  const handleOpenLink = () => {
    window.open('/affiliate/signup?q=8FS918X', '_blank');
  };

  // Selection helpers
  const handleSelectAll = () => {
    if (selectedIds.length === affiliates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(affiliates.map((a) => a.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Status updates
  const handleSingleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        onShowSnackbar(`Affiliate marked as ${newStatus}`, 'success');
        fetchAffiliates();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch {
      onShowSnackbar('Failed to update affiliate status', 'error');
    }
  };

  const handleBulkStatus = async (status) => {
    if (!selectedIds.length) return;
    try {
      const res = await fetch('/api/admin/affiliates/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: selectedIds, status })
      });
      if (res.ok) {
        onShowSnackbar(`Updated ${selectedIds.length} affiliates to ${status}`, 'success');
        setSelectedIds([]);
        fetchAffiliates();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch {
      onShowSnackbar('Bulk status update failed', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} affiliate application(s)?`)) return;
    try {
      const res = await fetch('/api/admin/affiliates/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: selectedIds })
      });
      if (res.ok) {
        onShowSnackbar(`Deleted ${selectedIds.length} affiliates`, 'info');
        setSelectedIds([]);
        fetchAffiliates();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch {
      onShowSnackbar('Bulk delete failed', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!affiliateToDelete) return;
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onShowSnackbar('Affiliate application deleted', 'info');
        setAffiliateToDelete(null);
        fetchAffiliates();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch {
      onShowSnackbar('Failed to delete affiliate record', 'error');
    }
  };

  const openInspectionModal = (aff) => {
    setActiveAffiliate(aff);
    setAdminNotes(aff.notes || '');
    setEditStatus(aff.status || 'pending');
  };

  const handleSaveModal = async () => {
    if (!activeAffiliate) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/affiliates/${activeAffiliate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: adminNotes, status: editStatus })
      });
      if (res.ok) {
        onShowSnackbar('Affiliate application saved successfully', 'success');
        setActiveAffiliate(null);
        fetchAffiliates();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch {
      onShowSnackbar('Failed to save changes', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Status stats calculation
  const pendingCount = affiliates.filter((a) => a.status === 'pending').length;
  const approvedCount = affiliates.filter((a) => a.status === 'approved').length;
  const rejectedCount = affiliates.filter((a) => a.status === 'rejected').length;

  return (
    <div className="admin-view-container animate-fade-in">
      {/* ── Route Control & Live Link Banner ──────────────── */}
      <div className="admin-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem', borderLeft: routeBlocked ? '4px solid #ef4444' : '4px solid #10b981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span className={`admin-badge ${routeBlocked ? 'badge-cancelled' : 'badge-booked'}`} style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.65rem' }}>
                {routeBlocked ? '● Route Blocked (Closed)' : '● Route Active (Accepting)'}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--md-outline)', fontFamily: 'monospace' }}>
                /affiliate/signup?q=8FS918X
              </span>
            </div>
            <div style={{ fontSize: '0.92rem', color: 'var(--md-on-surface-variant)' }}>
              {routeBlocked
                ? 'Visitors to the affiliate link see the paused / restricted access screen. Submissions are rejected with HTTP 403.'
                : 'The EverTree Solutions affiliate signup form is live. New applicants are saved to the database and viewable below.'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={handleCopyLink}
              title="Copy affiliate registration link to clipboard"
            >
              <FiCopy /> <span>Copy Link</span>
            </button>

            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={handleOpenLink}
              title="Preview public affiliate form in new tab"
            >
              <FiExternalLink /> <span>Open Route</span>
            </button>

            <button
              type="button"
              className={`admin-btn ${routeBlocked ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={handleToggleRoute}
              disabled={togglingRoute}
              style={{
                backgroundColor: routeBlocked ? '#10b981' : '#ef4444',
                color: '#ffffff',
                borderColor: 'transparent',
                fontWeight: 600
              }}
              title={routeBlocked ? 'Click to unblock route and accept signups' : 'Click to block route and pause signups'}
            >
              {routeBlocked ? <FiUnlock /> : <FiLock />}
              <span>{routeBlocked ? 'Unblock Route' : 'Block Route'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric Summary Tiles ──────────────────────────── */}
      <div className="admin-metrics-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="admin-metric-card" style={{ '--accent-gradient': 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
          <div className="admin-metric-header">
            <span className="admin-metric-title">Total Applications</span>
            <div className="admin-metric-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <FiLayers />
            </div>
          </div>
          <div className="admin-metric-value-row">
            <div className="admin-metric-value">{totalAffiliates}</div>
          </div>
          <div className="admin-metric-subtext">EverTree Solutions Submissions</div>
        </div>

        <div className="admin-metric-card" style={{ '--accent-gradient': 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
          <div className="admin-metric-header">
            <span className="admin-metric-title">Pending Review</span>
            <div className="admin-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <FiClock />
            </div>
          </div>
          <div className="admin-metric-value-row">
            <div className="admin-metric-value">{pendingCount}</div>
          </div>
          <div className="admin-metric-subtext">Awaiting rep contact</div>
        </div>

        <div className="admin-metric-card" style={{ '--accent-gradient': 'linear-gradient(135deg, #059669, #10b981)' }}>
          <div className="admin-metric-header">
            <span className="admin-metric-title">Approved Partners</span>
            <div className="admin-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <FiCheck />
            </div>
          </div>
          <div className="admin-metric-value-row">
            <div className="admin-metric-value">{approvedCount}</div>
          </div>
          <div className="admin-metric-subtext positive">Active network publishers</div>
        </div>

        <div className="admin-metric-card" style={{ '--accent-gradient': 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
          <div className="admin-metric-header">
            <span className="admin-metric-title">Rejected / Closed</span>
            <div className="admin-metric-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <FiX />
            </div>
          </div>
          <div className="admin-metric-value-row">
            <div className="admin-metric-value">{rejectedCount}</div>
          </div>
          <div className="admin-metric-subtext">Disqualified submissions</div>
        </div>
      </div>

      {/* ── Toolbar & Filters ─────────────────────────────── */}
      <div className="admin-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div className="admin-search-wrap" style={{ flex: 1, position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-outline)' }} />
            <input
              type="text"
              placeholder="Search by name, company, email, phone, teams, referral..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
              style={{ width: '100%', paddingLeft: '36px', height: '40px', borderRadius: '8px' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-select"
            style={{ height: '40px', minWidth: '150px' }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--md-surface-2)', padding: '0.3rem 0.65rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedIds.length} Selected</span>
              <button
                type="button"
                className="admin-btn admin-btn-sm"
                onClick={() => handleBulkStatus('approved')}
                style={{ color: '#10b981' }}
              >
                Approve
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-sm"
                onClick={() => handleBulkStatus('rejected')}
                style={{ color: '#ef4444' }}
              >
                Reject
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-sm"
                onClick={handleBulkDelete}
                style={{ color: '#ef4444' }}
              >
                Delete
              </button>
            </div>
          )}

          <a
            href={`/api/admin/affiliates/export-csv?search=${encodeURIComponent(search)}&status=${statusFilter}&sort_by=${sortBy}&sort_order=${sortOrder}`}
            className="admin-btn admin-btn-secondary"
            title="Download CSV export with all 27 fields"
            download
          >
            <FiDownload /> <span>Export CSV</span>
          </a>

          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={fetchAffiliates}
            title="Refresh Table"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* ── Affiliates Table ──────────────────────────────── */}
      <div className="admin-table-container admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                >
                  {selectedIds.length === affiliates.length && affiliates.length > 0 ? (
                    <FiCheckSquare style={{ color: 'var(--md-primary)' }} />
                  ) : (
                    <FiSquare />
                  )}
                </button>
              </th>
              <th>Applicant</th>
              <th>Company & Entity</th>
              <th>Contact Details</th>
              <th>Teams ID</th>
              <th>Offer Focus</th>
              <th>Referral</th>
              <th>Status</th>
              <th>Applied</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="admin-spinner" />
                  <p style={{ marginTop: '0.75rem', color: 'var(--md-outline)' }}>Loading affiliate records...</p>
                </td>
              </tr>
            ) : affiliates.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3.5rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--md-on-surface)' }}>No Affiliate Signups Found</div>
                  <p style={{ color: 'var(--md-outline)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {search || statusFilter !== 'all'
                      ? 'No applications match your search filter criteria.'
                      : 'Applications submitted via /affiliate/signup will appear here.'}
                  </p>
                </td>
              </tr>
            ) : (
              affiliates.map((aff) => {
                const isSelected = selectedIds.includes(aff.id);
                return (
                  <tr key={aff.id} className={isSelected ? 'row-selected' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(aff.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                      >
                        {isSelected ? (
                          <FiCheckSquare style={{ color: 'var(--md-primary)' }} />
                        ) : (
                          <FiSquare />
                        )}
                      </button>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--md-on-surface)' }}>
                        {aff.first_name} {aff.last_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--md-outline)' }}>ID: #{aff.id}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{aff.company_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--md-outline)' }}>{aff.legal_entity_type}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <a href={`mailto:${aff.email}`} style={{ color: 'var(--md-primary)', textDecoration: 'none' }}>
                          {aff.email}
                        </a>
                      </div>
                      {aff.phone && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--md-outline)' }}>
                          {aff.phone}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="admin-chip" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {aff.teams_user_id || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {aff.offer_types || '—'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--md-outline)' }}>
                        {aff.traffic_source || '—'}
                      </div>
                    </td>
                    <td>
                      {aff.referral_code ? (
                        <span className="admin-badge badge-contacted" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {aff.referral_code}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--md-outline)' }}>Direct</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge badge-${aff.status === 'approved' ? 'booked' : aff.status === 'rejected' ? 'cancelled' : 'new'}`}>
                        {aff.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--md-outline)', whiteSpace: 'nowrap' }}>
                      {aff.created_at ? aff.created_at.replace('T', ' ').slice(0, 16) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="admin-icon-btn-sm"
                        onClick={() => openInspectionModal(aff)}
                        title="View Full Application Data"
                        style={{ marginRight: '0.35rem' }}
                      >
                        <FiEye />
                      </button>
                      {aff.status !== 'approved' && (
                        <button
                          type="button"
                          className="admin-icon-btn-sm"
                          onClick={() => handleSingleStatusUpdate(aff.id, 'approved')}
                          title="Approve Partner"
                          style={{ color: '#10b981', marginRight: '0.35rem' }}
                        >
                          <FiCheck />
                        </button>
                      )}
                      {aff.status !== 'rejected' && (
                        <button
                          type="button"
                          className="admin-icon-btn-sm"
                          onClick={() => handleSingleStatusUpdate(aff.id, 'rejected')}
                          title="Reject Partner"
                          style={{ color: '#ef4444', marginRight: '0.35rem' }}
                        >
                          <FiX />
                        </button>
                      )}
                      <button
                        type="button"
                        className="admin-icon-btn-sm"
                        onClick={() => setAffiliateToDelete(aff)}
                        title="Delete Record"
                        style={{ color: '#ef4444' }}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Inspection & Full Data Modal ───────────────────── */}
      <AnimatePresence>
        {activeAffiliate && (
          <div className="admin-modal-overlay" onClick={() => setActiveAffiliate(null)}>
            <motion.div
              className="admin-modal"
              style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="admin-header-eyebrow">EVERTREE SOLUTIONS SIGNUP #{activeAffiliate.id}</span>
                  <h2>{activeAffiliate.first_name} {activeAffiliate.last_name}</h2>
                </div>
                <button type="button" className="admin-icon-btn" onClick={() => setActiveAffiliate(null)}>
                  <FiX />
                </button>
              </div>

              <div className="admin-modal-body" style={{ padding: '1.25rem 0' }}>
                {/* Section 1: General */}
                <div style={{ marginBottom: '1.5rem', background: 'var(--md-surface-2)', padding: '1rem 1.25rem', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', color: 'var(--md-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>01</span> General & Contact
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.88rem' }}>
                    <div><strong>Name:</strong> {activeAffiliate.first_name} {activeAffiliate.last_name}</div>
                    <div><strong>Email:</strong> <a href={`mailto:${activeAffiliate.email}`}>{activeAffiliate.email}</a></div>
                    <div><strong>Phone:</strong> {activeAffiliate.phone || '—'}</div>
                    <div><strong>Teams User ID:</strong> <span style={{ fontFamily: 'monospace' }}>{activeAffiliate.teams_user_id}</span></div>
                  </div>
                </div>

                {/* Section 2: Company & Address */}
                <div style={{ marginBottom: '1.5rem', background: 'var(--md-surface-2)', padding: '1rem 1.25rem', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', color: 'var(--md-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>02</span> Company & Registered Address
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.88rem' }}>
                    <div><strong>Company:</strong> {activeAffiliate.company_name}</div>
                    <div><strong>Entity Type:</strong> {activeAffiliate.legal_entity_type}</div>
                    <div><strong>Website:</strong> <a href={activeAffiliate.website_url} target="_blank" rel="noreferrer">{activeAffiliate.website_url}</a></div>
                    <div><strong>Address:</strong> {activeAffiliate.address} {activeAffiliate.address2 ? `(${activeAffiliate.address2})` : ''}</div>
                    <div><strong>Location:</strong> {activeAffiliate.city}, {activeAffiliate.country} ({activeAffiliate.zip_code})</div>
                  </div>
                </div>

                {/* Section 3: Billing & Taxes */}
                <div style={{ marginBottom: '1.5rem', background: 'var(--md-surface-2)', padding: '1rem 1.25rem', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', color: 'var(--md-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>03</span> Billing & Payout Preferences
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.88rem' }}>
                    <div><strong>Payment Method:</strong> {activeAffiliate.payment_method?.toUpperCase()}</div>
                    <div><strong>Tax ID / SSN / VAT:</strong> {activeAffiliate.tax_id || 'Not provided'}</div>
                  </div>
                </div>

                {/* Section 4: Questionnaire & Traffic Focus */}
                <div style={{ marginBottom: '1.5rem', background: 'var(--md-surface-2)', padding: '1rem 1.25rem', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', color: 'var(--md-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>04</span> Traffic, Offers & Media Capabilities
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.88rem' }}>
                    <div><strong>Offer Types:</strong> {activeAffiliate.offer_types}</div>
                    <div><strong>Primary Traffic Source:</strong> {activeAffiliate.traffic_source}</div>
                    <div><strong>Monthly Ad Budget:</strong> {activeAffiliate.monthly_ad_budget}</div>
                    <div><strong>Other Networks:</strong> {activeAffiliate.other_networks}</div>
                    <div><strong>Volume with Others:</strong> {activeAffiliate.monthly_volume_other_networks}</div>
                    <div><strong>TrustedForm / Jornaya:</strong> {activeAffiliate.collects_trustedform_jornaya}</div>
                  </div>
                  {activeAffiliate.advertising_methods && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.88rem', borderTop: '1px solid var(--md-outline-variant)', paddingTop: '0.65rem' }}>
                      <strong>Advertising Sites & Methods:</strong>
                      <p style={{ margin: '0.35rem 0 0', color: 'var(--md-on-surface-variant)', lineHeight: 1.5 }}>
                        {activeAffiliate.advertising_methods}
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 5: Tracking & Agreement */}
                <div style={{ marginBottom: '1.5rem', background: 'var(--md-surface-2)', padding: '1rem 1.25rem', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', color: 'var(--md-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>05</span> Tracking & Compliance
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.88rem' }}>
                    <div><strong>Referral Code (q):</strong> <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{activeAffiliate.referral_code || 'None'}</span></div>
                    <div><strong>Agreed to Terms:</strong> {activeAffiliate.agreed_terms ? 'Yes (EverTree Solutions Terms of Service v2026.1)' : 'No'}</div>
                    <div><strong>Applied At:</strong> {activeAffiliate.created_at}</div>
                  </div>
                </div>

                {/* Section 6: Admin Actions */}
                <div style={{ background: 'var(--md-surface-1)', border: '1px solid var(--md-outline-variant)', padding: '1.1rem', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>Partner Decision & Internal Notes</h4>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Status:</span>
                    {AFFILIATE_STATUSES.map((st) => (
                      <label key={st.value} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="radio"
                          name="statusRadio"
                          value={st.value}
                          checked={editStatus === st.value}
                          onChange={() => setEditStatus(st.value)}
                        />
                        <span style={{ color: st.color, fontWeight: 600 }}>{st.label}</span>
                      </label>
                    ))}
                  </div>

                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Internal Rep Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about compliance review, assigned Skype/Teams rep, payout tiers..."
                    className="admin-textarea"
                    style={{ width: '100%', borderRadius: '8px', padding: '0.65rem' }}
                  />
                </div>
              </div>

              <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setActiveAffiliate(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={handleSaveModal}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Dialog ───────────────────── */}
      <AnimatePresence>
        {affiliateToDelete && (
          <div className="admin-modal-overlay" onClick={() => setAffiliateToDelete(null)}>
            <motion.div
              className="admin-modal"
              style={{ maxWidth: '440px' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', marginBottom: '0.75rem' }}>
                <FiAlertTriangle style={{ fontSize: '1.5rem' }} />
                <h3 style={{ margin: 0 }}>Delete Application?</h3>
              </div>
              <p style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete the affiliate application for{' '}
                <strong>{affiliateToDelete.first_name} {affiliateToDelete.last_name}</strong> ({affiliateToDelete.company_name})? This cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setAffiliateToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn"
                  style={{ background: '#ef4444', color: '#ffffff', border: 'none' }}
                  onClick={handleDeleteConfirm}
                >
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
