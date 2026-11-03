import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiDownload, FiTrash2, FiEdit3, 
  FiX, FiSave, FiCheck, FiMail, FiPhone, 
  FiRadio, FiCheckSquare, FiSquare, FiRefreshCw,
  FiArrowUp, FiArrowDown, FiLayers, FiTag, FiClock, FiAlertTriangle
} from 'react-icons/fi';

const PUBLISHER_STATUSES = [
  { value: 'pending', label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { value: 'approved', label: 'Approved', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { value: 'active', label: 'Active Publisher', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { value: 'suspended', label: 'Suspended', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { value: 'rejected', label: 'Rejected', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)' }
];

export default function AdminPublishers({ onUpdateRefresh, onShowSnackbar }) {
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verticalFilter, setVerticalFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('25');
  const [totalPages, setTotalPages] = useState(1);
  const [totalPublishers, setTotalPublishers] = useState(0);

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Multi-Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Edit / Detail Modal
  const [editingPublisher, setEditingPublisher] = useState(null);
  const [publisherToDelete, setPublisherToDelete] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    company: '',
    email: '',
    phone: '',
    vertical: '',
    status: 'pending',
    notes: '',
    message: ''
  });

  const fetchPublishers = useCallback(async () => {
    setLoading(true);
    try {
      const perPageVal = pageSize === 'all' ? '0' : pageSize;
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        vertical: verticalFilter,
        page: page.toString(),
        per_page: perPageVal,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      const res = await fetch(`/api/admin/publishers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPublishers(data.publishers || []);
        setTotalPages(data.total_pages || 1);
        setTotalPublishers(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch publishers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, verticalFilter, page, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    fetchPublishers();
  }, [fetchPublishers]);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(publishers.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleOpenEdit = (publisher) => {
    setEditingPublisher(publisher);
    setEditForm({
      full_name: publisher.full_name || '',
      company: publisher.company || '',
      email: publisher.email || '',
      phone: publisher.phone || '',
      vertical: publisher.vertical || 'Other',
      status: publisher.status || 'pending',
      notes: publisher.notes || '',
      message: publisher.message || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingPublisher) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/publishers/${editingPublisher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (onShowSnackbar) onShowSnackbar(`Publisher #${editingPublisher.id} updated successfully!`, 'success');
        setEditingPublisher(null);
        fetchPublishers();
        if (onUpdateRefresh) onUpdateRefresh();
      } else {
        if (onShowSnackbar) onShowSnackbar(data.detail || 'Failed to update publisher record', 'error');
      }
    } catch (err) {
      console.error('Error updating publisher:', err);
      if (onShowSnackbar) onShowSnackbar('Error updating publisher record', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!publisherToDelete) return;
    try {
      const res = await fetch(`/api/admin/publishers/${publisherToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (onShowSnackbar) onShowSnackbar(`Publisher #${publisherToDelete.id} deleted`, 'info');
        setPublisherToDelete(null);
        setSelectedIds((prev) => prev.filter((id) => id !== publisherToDelete.id));
        fetchPublishers();
        if (onUpdateRefresh) onUpdateRefresh();
      } else {
        if (onShowSnackbar) onShowSnackbar('Could not delete publisher', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      if (onShowSnackbar) onShowSnackbar('Error deleting publisher', 'error');
    }
  };

  const handleBulkStatus = async (newStatus) => {
    if (!selectedIds.length) return;
    try {
      const res = await fetch('/api/admin/publishers/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: selectedIds, status: newStatus })
      });
      if (res.ok) {
        if (onShowSnackbar) onShowSnackbar(`Updated ${selectedIds.length} publishers to ${newStatus}`, 'success');
        setSelectedIds([]);
        fetchPublishers();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch (err) {
      console.error('Bulk status error:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected publishers?`)) return;

    try {
      const res = await fetch('/api/admin/publishers/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: selectedIds })
      });
      if (res.ok) {
        if (onShowSnackbar) onShowSnackbar(`Deleted ${selectedIds.length} publishers`, 'info');
        setSelectedIds([]);
        fetchPublishers();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
    }
  };

  const getStatusBadge = (status) => {
    const s = PUBLISHER_STATUSES.find((item) => item.value === status) || {
      label: status || 'Pending',
      color: '#6b7280',
      bg: 'rgba(107, 114, 128, 0.12)'
    };
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: s.color,
          background: s.bg,
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: s.color
          }}
        />
        {s.label}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="admin-panel">
        {/* Header Title & Actions */}
        <div className="admin-panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="admin-panel-title">
              <FiRadio style={{ color: '#00875a' }} />
              Publishers Hub &amp; Traffic Generators
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)', marginTop: '0.2rem', display: 'inline-block' }}>
              Media buyers, affiliate networks, and lead generators routing traffic into the EverTree network
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="admin-btn admin-btn-outline"
              onClick={fetchPublishers}
              title="Refresh"
            >
              <FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>Refresh</span>
            </button>

            <a
              href={`/api/admin/publishers/export-csv?search=${encodeURIComponent(search)}&status=${statusFilter}&vertical=${verticalFilter}&sort_by=${sortBy}&sort_order=${sortOrder}`}
              className="admin-btn admin-btn-primary"
              style={{ textDecoration: 'none' }}
              title="Export all filtered publishers to CSV"
            >
              <FiDownload />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="admin-filter-bar" style={{ padding: '1rem', background: 'var(--md-surface-container-low)', borderRadius: '12px', margin: '1rem 0', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-on-surface-variant)' }} />
            <input
              type="text"
              placeholder="Search publisher company, name, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid var(--md-outline-variant)',
                background: 'var(--md-surface)',
                color: 'var(--md-on-surface)',
                fontSize: '0.88rem'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--md-on-surface-variant)' }}
              >
                <FiX />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div style={{ flex: '0 1 180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--md-outline-variant)',
                background: 'var(--md-surface)',
                color: 'var(--md-on-surface)',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="active">Active Publisher</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Vertical Filter */}
          <div style={{ flex: '0 1 210px' }}>
            <select
              value={verticalFilter}
              onChange={(e) => { setVerticalFilter(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--md-outline-variant)',
                background: 'var(--md-surface)',
                color: 'var(--md-on-surface)',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Publisher Verticals</option>
              <option value="MVA (CPA)">MVA (CPA)</option>
              <option value="Mass Torts">Mass Torts</option>
              <option value="Final Expense supply">Final Expense supply</option>
              <option value="SSDI supply">SSDI supply</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Page Size */}
          <div style={{ flex: '0 1 130px', marginLeft: 'auto' }}>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--md-outline-variant)',
                background: 'var(--md-surface)',
                color: 'var(--md-on-surface)',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              <option value="15">15 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="all">View All</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--md-primary-container)',
              color: 'var(--md-on-primary-container)',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
              {selectedIds.length} publisher{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="admin-btn admin-btn-sm"
                onClick={() => handleBulkStatus('approved')}
                style={{ background: '#3b82f6', color: '#fff', border: 'none' }}
              >
                Approve
              </button>
              <button
                className="admin-btn admin-btn-sm"
                onClick={() => handleBulkStatus('active')}
                style={{ background: '#10b981', color: '#fff', border: 'none' }}
              >
                Set Active
              </button>
              <button
                className="admin-btn admin-btn-sm"
                onClick={() => handleBulkStatus('suspended')}
                style={{ background: '#ef4444', color: '#fff', border: 'none' }}
              >
                Suspend
              </button>
              <button
                className="admin-btn admin-btn-sm"
                onClick={handleBulkDelete}
                style={{ background: '#dc2626', color: '#fff', border: 'none' }}
              >
                <FiTrash2 /> Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Publishers Data Table */}
        <div className="admin-table-container" style={{ overflowX: 'auto', border: '1px solid var(--md-outline-variant)', borderRadius: '12px' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--md-surface-container-high)', borderBottom: '1px solid var(--md-outline-variant)' }}>
                <th style={{ width: '40px', padding: '12px' }}>
                  <input
                    type="checkbox"
                    checked={publishers.length > 0 && selectedIds.length === publishers.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                  ID {sortBy === 'id' && (sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                </th>
                <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('company')}>
                  Publishing Media &amp; Contact {sortBy === 'company' && (sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                </th>
                <th style={{ padding: '12px' }}>
                  Contact Channels
                </th>
                <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('vertical')}>
                  Supply Vertical {sortBy === 'vertical' && (sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                </th>
                <th style={{ padding: '12px' }}>
                  Traffic Profile &amp; Notes
                </th>
                <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                </th>
                <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
                  Applied {sortBy === 'created_at' && (sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                </th>
                <th style={{ padding: '12px', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--md-on-surface-variant)' }}>
                    <FiRefreshCw style={{ animation: 'spin 1s linear infinite', fontSize: '1.5rem', marginBottom: '8px' }} />
                    <div>Loading publisher network...</div>
                  </td>
                </tr>
              ) : publishers.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--md-on-surface-variant)' }}>
                    <FiRadio style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5, color: '#00875a' }} />
                    <div style={{ fontWeight: 600 }}>No publisher applications found</div>
                    <div style={{ fontSize: '0.85rem' }}>Publisher registrations submitted on the home page will appear here.</div>
                  </td>
                </tr>
              ) : (
                publishers.map((pub) => (
                  <tr
                    key={pub.id}
                    style={{
                      borderBottom: '1px solid var(--md-outline-variant)',
                      background: selectedIds.includes(pub.id) ? 'var(--md-surface-container-high)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(pub.id)}
                        onChange={() => handleSelectOne(pub.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--md-on-surface-variant)' }}>
                      #{pub.id}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--md-on-surface)' }}>
                        {pub.company || 'Affiliate / Publisher'}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--md-on-surface-variant)' }}>
                        {pub.full_name}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--md-on-surface)' }}>
                        <FiMail style={{ color: 'var(--md-primary)', fontSize: '0.85rem' }} />
                        <a href={`mailto:${pub.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {pub.email}
                        </a>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--md-on-surface-variant)', marginTop: '3px' }}>
                        <FiPhone style={{ fontSize: '0.85rem' }} />
                        <a href={`tel:${pub.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {pub.phone}
                        </a>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          background: 'rgba(0, 135, 90, 0.08)',
                          border: '1px solid rgba(0, 135, 90, 0.25)',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#00875a'
                        }}
                      >
                        {pub.vertical || 'General Traffic'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', maxWidth: '240px' }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--md-on-surface-variant)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={pub.message || pub.notes}
                      >
                        {pub.message || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No channel details provided</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getStatusBadge(pub.status)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.82rem', color: 'var(--md-on-surface-variant)', whiteSpace: 'nowrap' }}>
                      {pub.created_at ? new Date(pub.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="admin-icon-btn"
                        onClick={() => handleOpenEdit(pub)}
                        title="Edit Publisher Details"
                        style={{ marginRight: '6px' }}
                      >
                        <FiEdit3 />
                      </button>
                      <button
                        className="admin-icon-btn admin-icon-btn-danger"
                        onClick={() => setPublisherToDelete(pub)}
                        title="Delete Record"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Total Count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem 0', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)' }}>
            Showing {publishers.length} of {totalPublishers} total publisher records
          </span>

          {pageSize !== 'all' && totalPages > 1 && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="admin-btn admin-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '0.85rem', color: 'var(--md-on-surface)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="admin-btn admin-btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Publisher Modal ────────────────────────────── */}
      <AnimatePresence>
        {editingPublisher && (
          <div className="admin-modal-overlay" onClick={() => setEditingPublisher(null)}>
            <motion.div
              className="admin-modal"
              style={{ maxWidth: '600px', width: '92%' }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiRadio style={{ color: '#00875a', fontSize: '1.25rem' }} />
                  <h3 style={{ margin: 0 }}>Edit Publisher #{editingPublisher.id}</h3>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setEditingPublisher(null)}
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="admin-form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Company / Network Name</label>
                      <input
                        type="text"
                        value={editForm.company}
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--md-outline-variant)' }}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Contact Name</label>
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--md-outline-variant)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="admin-form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Work Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--md-outline-variant)' }}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Phone</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--md-outline-variant)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="admin-form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Supply Vertical</label>
                      <select
                        value={editForm.vertical}
                        onChange={(e) => setEditForm({ ...editForm, vertical: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--md-outline-variant)' }}
                      >
                        <option value="MVA (CPA)">MVA (CPA)</option>
                        <option value="Mass Torts">Mass Torts</option>
                        <option value="Final Expense supply">Final Expense supply</option>
                        <option value="SSDI supply">SSDI supply</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Partnership Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--md-outline-variant)' }}
                      >
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="active">Active Publisher</option>
                        <option value="suspended">Suspended</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Traffic Channels &amp; Application Message</label>
                    <textarea
                      rows="3"
                      value={editForm.message}
                      onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                      placeholder="Traffic sources, lead volume capabilities, opt-in details..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--md-outline-variant)' }}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Admin Internal Notes</label>
                    <textarea
                      rows="2"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Ping/post API token, payouts, compliance audit notes..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--md-outline-variant)' }}
                    />
                  </div>
                </div>

                <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid var(--md-outline-variant)' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    onClick={() => setEditingPublisher(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    disabled={savingEdit}
                  >
                    <FiSave />
                    <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Dialog ────────────────────── */}
      <AnimatePresence>
        {publisherToDelete && (
          <div className="admin-modal-overlay" onClick={() => setPublisherToDelete(null)}>
            <motion.div
              className="admin-modal"
              style={{ maxWidth: '440px', width: '90%' }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                  <FiAlertTriangle style={{ fontSize: '1.25rem' }} />
                  <h3 style={{ margin: 0 }}>Delete Publisher #{publisherToDelete.id}?</h3>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setPublisherToDelete(null)}
                >
                  <FiX />
                </button>
              </div>
              <div className="admin-modal-body">
                <p style={{ margin: 0, color: 'var(--md-on-surface-variant)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Are you sure you want to permanently delete the publisher record for <strong>{publisherToDelete.company || publisherToDelete.full_name}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setPublisherToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  onClick={handleDelete}
                >
                  <FiTrash2 /> Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

