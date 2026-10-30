import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiDownload, FiEye, FiTrash2, 
  FiX, FiSave, FiExternalLink, FiShield, FiEdit3, 
  FiPlus, FiList, FiColumns, FiCheckSquare, FiSquare, 
  FiPhone, FiMail, FiMapPin, FiCopy, FiCheck, FiArrowUp, FiArrowDown
} from 'react-icons/fi';

export default function AdminLeads({ onUpdateRefresh, onShowSnackbar, initialServiceFilter = 'all' }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState(initialServiceFilter);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('all'); // 'all' (Full List), '25', '50', '100', '15'
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // View Mode: 'table' | 'kanban'
  const [viewMode, setViewMode] = useState('table');

  // Multi-Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawers
  const [selectedLead, setSelectedLead] = useState(null);
  const [editedNotes, setEditedNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  // Edit Lead State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Add Lead Form State
  const [newLead, setNewLead] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    zip_code: '',
    service_type: 'Health Insurance',
    status: 'new',
    annual_income_range: '',
    current_provider: '',
    notes: ''
  });
  const [addingLead, setAddingLead] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const perPageValue = viewMode === 'kanban' ? '0' : (pageSize === 'all' ? '0' : pageSize);
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        service_type: serviceFilter,
        page: page.toString(),
        per_page: perPageValue,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setTotalPages(data.total_pages || 1);
      setTotalLeads(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, serviceFilter, page, pageSize, sortBy, sortOrder, viewMode]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handle sort column click
  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map(l => l.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Status Change
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/leads/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: selectedIds, status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        if (onShowSnackbar) onShowSnackbar(`Updated ${data.updated_count} leads to ${newStatus.toUpperCase()}`, 'success');
        setSelectedIds([]);
        fetchLeads();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch (err) {
      console.error('Bulk update failed:', err);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected leads permanently?`)) return;
    try {
      const res = await fetch('/api/leads/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: selectedIds })
      });
      const data = await res.json();
      if (res.ok) {
        if (onShowSnackbar) onShowSnackbar(`Deleted ${data.deleted_count} leads`, 'info');
        setSelectedIds([]);
        fetchLeads();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  // Quick Status Change for single lead
  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        if (onShowSnackbar) onShowSnackbar(`Lead #${leadId} status set to ${newStatus.toUpperCase()}`, 'success');
        fetchLeads();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  // Save Lead Notes
  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editedNotes }),
      });
      if (res.ok) {
        const updatedData = await res.json();
        setSelectedLead(updatedData.lead);
        if (onShowSnackbar) onShowSnackbar('Lead notes saved successfully', 'success');
        fetchLeads();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Enter Edit Mode
  const enterEditMode = (lead) => {
    setEditFormData({
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      zip_code: lead.zip_code || '',
      service_type: lead.service_type || 'Health Insurance',
      status: lead.status || 'new',
      current_provider: lead.current_provider || '',
      annual_income_range: lead.annual_income_range || '',
      notes: lead.notes || ''
    });
    setIsEditMode(true);
  };

  // Save Edited Lead
  const handleSaveEdit = async () => {
    if (!selectedLead) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (res.ok) {
        const updatedData = await res.json();
        setSelectedLead(updatedData.lead);
        setEditedNotes(updatedData.lead.notes || '');
        setIsEditMode(false);
        if (onShowSnackbar) onShowSnackbar('Lead updated successfully', 'success');
        fetchLeads();
        if (onUpdateRefresh) onUpdateRefresh();
      } else {
        if (onShowSnackbar) onShowSnackbar('Failed to update lead', 'error');
      }
    } catch (err) {
      console.error('Failed to save lead edits:', err);
      if (onShowSnackbar) onShowSnackbar('Error saving lead', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Single Lead
  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;
    try {
      const res = await fetch(`/api/leads/${leadToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (onShowSnackbar) onShowSnackbar(`Lead #${leadToDelete.id} deleted`, 'info');
        setLeadToDelete(null);
        fetchLeads();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  // Create Manual Lead
  const handleCreateLead = async (e) => {
    e.preventDefault();
    setAddingLead(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewLead({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          zip_code: '',
          service_type: 'Health Insurance',
          status: 'new',
          annual_income_range: '',
          current_provider: '',
          notes: ''
        });
        if (onShowSnackbar) onShowSnackbar('New lead created successfully', 'success');
        fetchLeads();
        if (onUpdateRefresh) onUpdateRefresh();
      }
    } catch (err) {
      console.error('Failed to create lead:', err);
    } finally {
      setAddingLead(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    if (onShowSnackbar) onShowSnackbar(`Copied ${field} to clipboard`, 'info');
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Safe Blob CSV Download Helper
  const exportRecordsToCSV = (listToExport, fileName) => {
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Zip Code',
      'Service Type',
      'Current Provider',
      'Income Range',
      'Household Size',
      'Date of Birth',
      'Status',
      'TrustedForm Certificate',
      'Created At'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = listToExport.map(l => {
      const tfUrl = (l.trusted_form_cert_url || '').trim();
      const tfHyperlink = tfUrl ? `"=HYPERLINK(""${tfUrl.replace(/"/g, '""')}"", ""${tfUrl.replace(/"/g, '""')}"")"` : '""';
      return [
        l.id,
        escapeCSV(l.first_name),
        escapeCSV(l.last_name),
        escapeCSV(l.email),
        escapeCSV(l.phone),
        escapeCSV(l.zip_code),
        escapeCSV(l.service_type),
        escapeCSV(l.current_provider || ''),
        escapeCSV(l.annual_income_range || ''),
        escapeCSV(l.household_size || ''),
        escapeCSV(l.date_of_birth || ''),
        escapeCSV(l.status),
        tfHyperlink,
        escapeCSV(l.created_at)
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = fileName;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();

    // Retain object URL for 60s to ensure Chromium/mobile browsers finish download with full filename
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 60000);
  };

  // CSV Export Handler
  const handleExportCSV = async (exportSelected = false) => {
    const todayStr = new Date().toISOString().slice(0, 10);

    if (exportSelected) {
      const listToExport = leads.filter(l => selectedIds.includes(l.id));
      if (listToExport.length === 0) {
        if (onShowSnackbar) onShowSnackbar('No selected customer records found to export', 'warning');
        return;
      }
      exportRecordsToCSV(listToExport, `evertree_selected_${todayStr}.csv`);
      if (onShowSnackbar) onShowSnackbar(`Successfully exported ${listToExport.length} selected customers to CSV`, 'success');
      return;
    }

    const fileName = `evertree_customers_${todayStr}.csv`;

    // Case 1: Full list is already loaded in current view
    if (pageSize === 'all' && leads.length >= totalLeads && leads.length > 0) {
      exportRecordsToCSV(leads, fileName);
      if (onShowSnackbar) onShowSnackbar(`Successfully exported all ${leads.length} customer records to CSV`, 'success');
      return;
    }

    // Case 2: Fetch all matching records from backend
    if (onShowSnackbar) onShowSnackbar('Preparing complete customer export...', 'info');
    try {
      const params = new URLSearchParams({
        search: search || '',
        status: statusFilter || 'all',
        service_type: serviceFilter || 'all',
        page: '1',
        per_page: '0',
        sort_by: sortBy || 'created_at',
        sort_order: sortOrder || 'desc'
      });

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      const allLeads = data.leads || [];

      if (allLeads.length === 0) {
        if (onShowSnackbar) onShowSnackbar('No customer records found to export', 'warning');
        return;
      }

      exportRecordsToCSV(allLeads, fileName);
      if (onShowSnackbar) onShowSnackbar(`Successfully exported all ${allLeads.length} customers with TrustedForm links to CSV`, 'success');
    } catch (err) {
      console.error('CSV Export fallback error:', err);
      if (leads.length > 0) {
        exportRecordsToCSV(leads, fileName);
        if (onShowSnackbar) onShowSnackbar(`Exported ${leads.length} available customer records to CSV`, 'warning');
      } else {
        if (onShowSnackbar) onShowSnackbar('Failed to export customer list to CSV', 'error');
      }
    }
  };

  // Group leads for Kanban board
  const kanbanColumns = {
    new: leads.filter(l => l.status === 'new'),
    contacted: leads.filter(l => l.status === 'contacted'),
    qualified: leads.filter(l => l.status === 'qualified'),
    closed: leads.filter(l => l.status === 'closed')
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Top Controls Toolbar */}
      <div className="admin-table-controls">
        {/* Search */}
        <div className="admin-search-box">
          <FiSearch className="admin-input-icon" />
          <input
            type="text"
            className="admin-input"
            placeholder="Search by name, email, phone, or zip..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Filters Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="closed">Closed</option>
          </select>

          {/* Service Filter */}
          <select
            className="admin-select"
            value={serviceFilter}
            onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Verticals</option>
            <option value="Health Insurance">Health Insurance</option>
            <option value="Home Improvement">Home Improvement</option>
            <option value="Auto & Home Insurance">Auto & Home Insurance</option>
            <option value="Debt Relief">Debt Relief</option>
            <option value="Legal Help">Legal Help</option>
            <option value="Medicare">Medicare</option>
            <option value="Flight Booking">Flight Booking</option>
          </select>

          {/* View Mode Toggle (Table / Kanban) */}
          <div className="admin-view-mode-toggle">
            <button
              className={`admin-view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <FiList /> Table
            </button>
            <button
              className={`admin-view-mode-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban Board View"
            >
              <FiColumns /> Kanban
            </button>
          </div>

          {/* Display Mode / Rows Selector */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--md-on-surface-variant)', fontWeight: 600 }}>Show:</span>
            <select
              className="admin-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value);
                setPage(1);
              }}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              title="Select number of customers to display"
            >
              <option value="all">Full List ({totalLeads})</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
              <option value="15">15 per page</option>
            </select>
          </div>

          {/* Action Buttons */}
          <button className="admin-btn-secondary" onClick={() => handleExportCSV(false)} title="Export All Customers to CSV">
            <FiDownload /> Export CSV
          </button>

          <button className="admin-btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> New Lead
          </button>
        </div>
      </div>

      {/* Floating Multi-Select Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            className="admin-bulk-action-bar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="admin-bulk-left">
              <span className="admin-bulk-badge">{selectedIds.length}</span>
              <span>leads selected</span>
            </div>

            <div className="admin-bulk-actions">
              <button className="admin-bulk-btn" onClick={() => handleBulkStatusChange('contacted')}>
                Mark Contacted
              </button>
              <button className="admin-bulk-btn" onClick={() => handleBulkStatusChange('qualified')}>
                Mark Qualified
              </button>
              <button className="admin-bulk-btn" onClick={() => handleBulkStatusChange('closed')}>
                Mark Closed
              </button>
              <button className="admin-bulk-btn" onClick={() => handleExportCSV(true)}>
                <FiDownload /> Export Selected
              </button>
              <button className="admin-bulk-btn delete" onClick={handleBulkDelete}>
                <FiTrash2 /> Delete
              </button>
              <button className="admin-bulk-btn" style={{ background: 'transparent' }} onClick={() => setSelectedIds([])}>
                <FiX />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View 1: Material Data Grid Table View */}
      {viewMode === 'table' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox"
                    className="admin-checkbox"
                    checked={leads.length > 0 && selectedIds.length === leads.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="sortable" onClick={() => handleSort('first_name')}>
                  Lead / Customer {sortBy === 'first_name' && (sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                </th>
                <th className="sortable" onClick={() => handleSort('service_type')}>
                  Service Vertical {sortBy === 'service_type' && (sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                </th>
                <th>Contact Info</th>
                <th>TrustedForm</th>
                <th className="sortable" onClick={() => handleSort('status')}>
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                </th>
                <th className="sortable" onClick={() => handleSort('created_at')}>
                  Date {sortBy === 'created_at' && (sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--md-on-surface-variant)' }}>
                    Loading leads directory...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--md-on-surface-variant)' }}>
                    No leads found matching current search criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);
                  return (
                    <tr key={lead.id} className={isSelected ? 'selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          className="admin-checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(lead.id)}
                        />
                      </td>
                      <td>
                        <div className="admin-customer-cell">
                          <span className="admin-customer-name">{lead.first_name} {lead.last_name}</span>
                          <span className="admin-customer-sub">Zip: {lead.zip_code}</span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--md-on-surface)' }}>{lead.service_type}</strong>
                      </td>
                      <td>
                        <div className="admin-customer-cell">
                          <span style={{ color: 'var(--md-primary)', fontWeight: 600, fontSize: '0.85rem' }}>{lead.email}</span>
                          <span className="admin-customer-sub">{lead.phone}</span>
                        </div>
                      </td>
                      <td>
                        {lead.trusted_form_cert_url ? (
                          <a
                            href={lead.trusted_form_cert_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tf-badge link"
                            title={`Open TrustedForm Certificate:\n${lead.trusted_form_cert_url}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.3rem', 
                              textDecoration: 'none',
                              cursor: 'pointer' 
                            }}
                          >
                            <FiShield /> Certificate <FiExternalLink style={{ fontSize: '0.72rem', opacity: 0.8 }} />
                          </a>
                        ) : (
                          <span className="tf-badge none">
                            Standard
                          </span>
                        )}
                      </td>
                      <td>
                        <select
                          className={`status-pill ${lead.status}`}
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        >
                          <option value="new">NEW</option>
                          <option value="contacted">CONTACTED</option>
                          <option value="qualified">QUALIFIED</option>
                          <option value="closed">CLOSED</option>
                        </select>
                      </td>
                      <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="admin-action-btn"
                            title="Inspect Lead Details"
                            onClick={() => {
                              setSelectedLead(lead);
                              setEditedNotes(lead.notes || '');
                              setIsEditMode(false);
                            }}
                          >
                            <FiEye />
                          </button>
                          <button
                            className="admin-action-btn"
                            title="Edit Lead"
                            onClick={() => {
                              setSelectedLead(lead);
                              setEditedNotes(lead.notes || '');
                              enterEditMode(lead);
                            }}
                          >
                            <FiEdit3 />
                          </button>
                          <button
                            className="admin-action-btn delete"
                            title="Delete Lead"
                            onClick={() => setLeadToDelete(lead)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="admin-pagination">
            <span>
              {pageSize === 'all'
                ? `Showing all ${leads.length} of ${totalLeads} customer records`
                : `Showing ${leads.length} of ${totalLeads} total records`}
            </span>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--md-on-surface-variant)' }}>Display:</span>
                <select
                  className="admin-select"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.82rem', minWidth: 'auto' }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">Full List (All)</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                  <option value="15">15 per page</option>
                </select>
              </div>

              {pageSize !== 'all' && (
                <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    className="admin-btn-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span style={{ alignSelf: 'center', color: 'var(--md-on-surface)', fontWeight: 700, margin: '0 0.4rem' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="admin-btn-secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View 2: Interactive Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="admin-kanban-board">
          {/* Column 1: New */}
          <div className="admin-kanban-column">
            <div className="admin-kanban-column-header">
              <div className="admin-kanban-column-title" style={{ color: '#0B6B5C' }}>
                <span className="admin-status-badge-dot" style={{ backgroundColor: '#0B6B5C' }} />
                New Leads
              </div>
              <span className="admin-kanban-count">{kanbanColumns.new.length}</span>
            </div>

            <div className="admin-kanban-cards-list">
              {kanbanColumns.new.map(lead => (
                <div key={lead.id} className="admin-kanban-card" onClick={() => { setSelectedLead(lead); setEditedNotes(lead.notes || ''); }}>
                  <div className="admin-kanban-card-top">
                    <span className="admin-kanban-lead-name">{lead.first_name} {lead.last_name}</span>
                    <span className="status-pill new" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>New</span>
                  </div>
                  <div className="admin-kanban-meta" style={{ color: 'var(--md-primary)', fontWeight: 600 }}>
                    {lead.service_type}
                  </div>
                  <div className="admin-kanban-meta">
                    📍 {lead.zip_code} • {lead.email}
                  </div>
                  <div className="admin-kanban-card-footer">
                    <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                    <button 
                      className="admin-btn-secondary" 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, 'contacted'); }}
                    >
                      Advance ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Contacted */}
          <div className="admin-kanban-column">
            <div className="admin-kanban-column-header">
              <div className="admin-kanban-column-title" style={{ color: '#d97706' }}>
                <span className="admin-status-badge-dot" style={{ backgroundColor: '#d97706' }} />
                Contacted
              </div>
              <span className="admin-kanban-count">{kanbanColumns.contacted.length}</span>
            </div>

            <div className="admin-kanban-cards-list">
              {kanbanColumns.contacted.map(lead => (
                <div key={lead.id} className="admin-kanban-card" onClick={() => { setSelectedLead(lead); setEditedNotes(lead.notes || ''); }}>
                  <div className="admin-kanban-card-top">
                    <span className="admin-kanban-lead-name">{lead.first_name} {lead.last_name}</span>
                    <span className="status-pill contacted" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>Contacted</span>
                  </div>
                  <div className="admin-kanban-meta" style={{ color: '#d97706', fontWeight: 600 }}>
                    {lead.service_type}
                  </div>
                  <div className="admin-kanban-meta">
                    📍 {lead.zip_code} • {lead.phone}
                  </div>
                  <div className="admin-kanban-card-footer">
                    <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                    <button 
                      className="admin-btn-secondary" 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, 'qualified'); }}
                    >
                      Qualify ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Qualified */}
          <div className="admin-kanban-column">
            <div className="admin-kanban-column-header">
              <div className="admin-kanban-column-title" style={{ color: '#10b981' }}>
                <span className="admin-status-badge-dot" style={{ backgroundColor: '#10b981' }} />
                Qualified
              </div>
              <span className="admin-kanban-count">{kanbanColumns.qualified.length}</span>
            </div>

            <div className="admin-kanban-cards-list">
              {kanbanColumns.qualified.map(lead => (
                <div key={lead.id} className="admin-kanban-card" onClick={() => { setSelectedLead(lead); setEditedNotes(lead.notes || ''); }}>
                  <div className="admin-kanban-card-top">
                    <span className="admin-kanban-lead-name">{lead.first_name} {lead.last_name}</span>
                    <span className="status-pill qualified" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>Qualified</span>
                  </div>
                  <div className="admin-kanban-meta" style={{ color: '#10b981', fontWeight: 600 }}>
                    {lead.service_type}
                  </div>
                  <div className="admin-kanban-meta">
                    📍 {lead.zip_code} • {lead.email}
                  </div>
                  <div className="admin-kanban-card-footer">
                    <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                    <button 
                      className="admin-btn-secondary" 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, 'closed'); }}
                    >
                      Close ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: Closed */}
          <div className="admin-kanban-column">
            <div className="admin-kanban-column-header">
              <div className="admin-kanban-column-title" style={{ color: '#64748b' }}>
                <span className="admin-status-badge-dot" style={{ backgroundColor: '#64748b' }} />
                Closed
              </div>
              <span className="admin-kanban-count">{kanbanColumns.closed.length}</span>
            </div>

            <div className="admin-kanban-cards-list">
              {kanbanColumns.closed.map(lead => (
                <div key={lead.id} className="admin-kanban-card" onClick={() => { setSelectedLead(lead); setEditedNotes(lead.notes || ''); }}>
                  <div className="admin-kanban-card-top">
                    <span className="admin-kanban-lead-name">{lead.first_name} {lead.last_name}</span>
                    <span className="status-pill closed" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>Closed</span>
                  </div>
                  <div className="admin-kanban-meta" style={{ color: 'var(--md-on-surface-variant)', fontWeight: 600 }}>
                    {lead.service_type}
                  </div>
                  <div className="admin-kanban-meta">
                    📍 {lead.zip_code}
                  </div>
                  <div className="admin-kanban-card-footer">
                    <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Converted</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Inspection / Edit Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="admin-modal-overlay">
            <motion.div
              className="admin-modal-content"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
            >
              <div className="admin-modal-header">
                <div>
                  <h3 className="admin-modal-title">
                    {isEditMode ? '✏️ Edit' : ''} Lead #{selectedLead.id} Profile
                  </h3>
                  <span style={{ color: 'var(--md-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                    Captured on {new Date(selectedLead.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {!isEditMode && (
                    <button
                      className="admin-btn-secondary"
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => enterEditMode(selectedLead)}
                      title="Edit Lead"
                    >
                      <FiEdit3 /> Edit
                    </button>
                  )}
                  <button className="admin-modal-close" onClick={() => { setSelectedLead(null); setIsEditMode(false); }}>
                    <FiX />
                  </button>
                </div>
              </div>

              {/* --- EDIT MODE --- */}
              {isEditMode ? (
                <>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.5rem', 
                    padding: '0.6rem 1rem', marginBottom: '1.25rem',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.08))',
                    borderRadius: '0.75rem', border: '1px solid rgba(99,102,241,0.2)',
                    fontSize: '0.85rem', color: 'var(--md-primary)', fontWeight: 600
                  }}>
                    <FiEdit3 /> You are editing this lead record. Changes are saved when you click "Save Changes".
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">First Name</label>
                      <input
                        type="text"
                        className="admin-input"
                        style={{ paddingLeft: '1rem' }}
                        value={editFormData.first_name}
                        onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Last Name</label>
                      <input
                        type="text"
                        className="admin-input"
                        style={{ paddingLeft: '1rem' }}
                        value={editFormData.last_name}
                        onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Email Address</label>
                      <input
                        type="email"
                        className="admin-input"
                        style={{ paddingLeft: '1rem' }}
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Phone Number</label>
                      <input
                        type="text"
                        className="admin-input"
                        style={{ paddingLeft: '1rem' }}
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Service Vertical</label>
                      <select
                        className="admin-select"
                        style={{ width: '100%' }}
                        value={editFormData.service_type}
                        onChange={(e) => setEditFormData({ ...editFormData, service_type: e.target.value })}
                      >
                        <option value="Health Insurance">Health Insurance</option>
                        <option value="Home Improvement">Home Improvement</option>
                        <option value="Auto & Home Insurance">Auto & Home Insurance</option>
                        <option value="Debt Relief">Debt Relief</option>
                        <option value="Legal Help">Legal Help</option>
                        <option value="Medicare">Medicare</option>
                        <option value="Flight Booking">Flight Booking</option>
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Zip Code</label>
                      <input
                        type="text"
                        className="admin-input"
                        style={{ paddingLeft: '1rem' }}
                        value={editFormData.zip_code}
                        onChange={(e) => setEditFormData({ ...editFormData, zip_code: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Status</label>
                      <select
                        className="admin-select"
                        style={{ width: '100%' }}
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      >
                        <option value="new">NEW</option>
                        <option value="contacted">CONTACTED</option>
                        <option value="qualified">QUALIFIED</option>
                        <option value="closed">CLOSED</option>
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Current Provider</label>
                      <input
                        type="text"
                        className="admin-input"
                        style={{ paddingLeft: '1rem' }}
                        placeholder="e.g. Aetna, State Farm..."
                        value={editFormData.current_provider}
                        onChange={(e) => setEditFormData({ ...editFormData, current_provider: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                    <label className="admin-form-label">Income Range</label>
                    <select
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={editFormData.annual_income_range}
                      onChange={(e) => setEditFormData({ ...editFormData, annual_income_range: e.target.value })}
                    >
                      <option value="">Not specified</option>
                      <option value="Under $20k">Under $20k</option>
                      <option value="$20k - $40k">$20k - $40k</option>
                      <option value="$40k - $60k">$40k - $60k</option>
                      <option value="$60k - $90k">$60k - $90k</option>
                      <option value="$90k - $120k">$90k - $120k</option>
                      <option value="Over $120k">Over $120k</option>
                    </select>
                  </div>

                  <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FiEdit3 /> Internal Notes
                    </label>
                    <textarea
                      className="admin-notes-textarea"
                      placeholder="Record interaction notes, quotes delivered, follow-up schedule..."
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button className="admin-btn-secondary" onClick={() => setIsEditMode(false)}>
                      Cancel Edit
                    </button>
                    <button className="admin-btn-primary" onClick={handleSaveEdit} disabled={savingEdit}>
                      <FiSave /> {savingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </>
              ) : (
                /* --- VIEW MODE (original) --- */
                <>
                  {/* Quick Contact Action Bar */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    <a 
                      href={`mailto:${selectedLead.email}`} 
                      className="admin-btn-secondary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <FiMail /> Send Email
                    </a>
                    <a 
                      href={`tel:${selectedLead.phone}`} 
                      className="admin-btn-secondary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <FiPhone /> Call Phone
                    </a>
                    <button 
                      className="admin-btn-secondary"
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => copyToClipboard(`${selectedLead.first_name} ${selectedLead.last_name}\n${selectedLead.email}\n${selectedLead.phone}\nZip: ${selectedLead.zip_code}`, 'Full Lead Info')}
                    >
                      {copiedField === 'Full Lead Info' ? <FiCheck style={{ color: '#10b981' }} /> : <FiCopy />} Copy Details
                    </button>
                  </div>

                  <div className="admin-detail-grid">
                    <div className="admin-detail-item">
                      <div className="admin-detail-label">Customer Name</div>
                      <div className="admin-detail-value">{selectedLead.first_name} {selectedLead.last_name}</div>
                    </div>
                    <div className="admin-detail-item">
                      <div className="admin-detail-label">Service Vertical</div>
                      <div className="admin-detail-value" style={{ color: 'var(--md-primary)' }}>{selectedLead.service_type}</div>
                    </div>
                    <div className="admin-detail-item">
                      <div className="admin-detail-label">Email Address</div>
                      <div className="admin-detail-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{selectedLead.email}</span>
                        <button 
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--md-on-surface-variant)' }}
                          onClick={() => copyToClipboard(selectedLead.email, 'Email')}
                        >
                          <FiCopy />
                        </button>
                      </div>
                    </div>
                    <div className="admin-detail-item">
                      <div className="admin-detail-label">Phone Number</div>
                      <div className="admin-detail-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{selectedLead.phone}</span>
                        <button 
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--md-on-surface-variant)' }}
                          onClick={() => copyToClipboard(selectedLead.phone, 'Phone')}
                        >
                          <FiCopy />
                        </button>
                      </div>
                    </div>
                    <div className="admin-detail-item">
                      <div className="admin-detail-label">Zip Code</div>
                      <div className="admin-detail-value">{selectedLead.zip_code}</div>
                    </div>
                    <div className="admin-detail-item">
                      <div className="admin-detail-label">Date of Birth</div>
                      <div className="admin-detail-value">{selectedLead.date_of_birth || 'N/A'}</div>
                    </div>
                    <div className="admin-detail-item">
                      <div className="admin-detail-label">Current Provider</div>
                      <div className="admin-detail-value">{selectedLead.current_provider || 'None / First Time'}</div>
                    </div>
                    <div className="admin-detail-item">
                      <div className="admin-detail-label">Income Range</div>
                      <div className="admin-detail-value">{selectedLead.annual_income_range || 'Not specified'}</div>
                    </div>
                  </div>

                  {/* TrustedForm Verification */}
                  <div className="admin-detail-item" style={{ marginBottom: '1.5rem', background: 'var(--md-primary-container)', borderColor: 'var(--md-outline)' }}>
                    <div className="admin-detail-label" style={{ color: 'var(--md-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FiShield /> ActiveProspect TrustedForm Certificate
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ maxWidth: '75%', wordBreak: 'break-all' }}>
                        {selectedLead.trusted_form_cert_url ? (
                          <a
                            href={selectedLead.trusted_form_cert_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--md-primary)', fontSize: '0.88rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'underline' }}
                            title={selectedLead.trusted_form_cert_url}
                          >
                            {selectedLead.trusted_form_cert_url} <FiExternalLink style={{ flexShrink: 0 }} />
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.88rem', color: 'var(--md-on-surface-variant)' }}>
                            No certificate recorded
                          </span>
                        )}
                      </div>
                      {selectedLead.trusted_form_cert_url && (
                        <a
                          href={selectedLead.trusted_form_cert_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-btn-secondary"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          Open Certificate <FiExternalLink />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FiEdit3 /> Internal Qualification & Agent Notes
                    </label>
                    <textarea
                      className="admin-notes-textarea"
                      placeholder="Record interaction notes, quotes delivered, follow-up schedule..."
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button className="admin-btn-secondary" onClick={() => setSelectedLead(null)}>
                      Close
                    </button>
                    <button className="admin-btn-primary" onClick={handleSaveNotes} disabled={savingNotes}>
                      <FiSave /> {savingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual "New Lead" Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="admin-modal-overlay">
            <motion.div
              className="admin-modal-content"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
            >
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Create Manual Lead Record</h3>
                <button className="admin-modal-close" onClick={() => setShowAddModal(false)}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleCreateLead}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">First Name *</label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ paddingLeft: '1rem' }}
                      placeholder="e.g. Michael"
                      value={newLead.first_name}
                      onChange={(e) => setNewLead({ ...newLead, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Last Name *</label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ paddingLeft: '1rem' }}
                      placeholder="e.g. Scott"
                      value={newLead.last_name}
                      onChange={(e) => setNewLead({ ...newLead, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Email Address *</label>
                    <input
                      type="email"
                      className="admin-input"
                      style={{ paddingLeft: '1rem' }}
                      placeholder="e.g. michael@example.com"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Phone Number *</label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ paddingLeft: '1rem' }}
                      placeholder="e.g. (555) 019-2834"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Service Vertical</label>
                    <select
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={newLead.service_type}
                      onChange={(e) => setNewLead({ ...newLead, service_type: e.target.value })}
                    >
                      <option value="Health Insurance">Health Insurance</option>
                      <option value="Home Improvement">Home Improvement</option>
                      <option value="Auto & Home Insurance">Auto & Home Insurance</option>
                      <option value="Debt Relief">Debt Relief</option>
                      <option value="Legal Help">Legal Help</option>
                      <option value="Medicare">Medicare</option>
                      <option value="Flight Booking">Flight Booking</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Zip Code *</label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ paddingLeft: '1rem' }}
                      placeholder="e.g. 78701"
                      value={newLead.zip_code}
                      onChange={(e) => setNewLead({ ...newLead, zip_code: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Income Range</label>
                    <select
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={newLead.annual_income_range}
                      onChange={(e) => setNewLead({ ...newLead, annual_income_range: e.target.value })}
                    >
                      <option value="">Not specified</option>
                      <option value="Under $20k">Under $20k</option>
                      <option value="$20k - $40k">$20k - $40k</option>
                      <option value="$40k - $60k">$40k - $60k</option>
                      <option value="$60k - $90k">$60k - $90k</option>
                      <option value="$90k - $120k">$90k - $120k</option>
                      <option value="Over $120k">Over $120k</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Current Provider</label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ paddingLeft: '1rem' }}
                      placeholder="e.g. Aetna, State Farm..."
                      value={newLead.current_provider}
                      onChange={(e) => setNewLead({ ...newLead, current_provider: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Initial Internal Notes</label>
                  <textarea
                    className="admin-notes-textarea"
                    placeholder="Enter context, intake notes or referral source..."
                    value={newLead.notes}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" className="admin-btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn-primary" disabled={addingLead}>
                    {addingLead ? 'Saving Lead...' : 'Create Lead Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {leadToDelete && (
          <div className="admin-modal-overlay">
            <motion.div
              className="admin-modal-content"
              style={{ maxWidth: '420px', textAlign: 'center' }}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
            >
              <div style={{ color: 'var(--md-error)', fontSize: '2.5rem', marginBottom: '1rem' }}>
                <FiTrash2 />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--md-on-surface)', marginBottom: '0.5rem', fontWeight: 800 }}>
                Delete Lead #{leadToDelete.id}?
              </h3>
              <p style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Are you sure you want to delete lead record for <strong>{leadToDelete.first_name} {leadToDelete.last_name}</strong>? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button className="admin-btn-secondary" onClick={() => setLeadToDelete(null)}>
                  Cancel
                </button>
                <button className="admin-btn-primary" style={{ background: 'var(--md-error)', color: '#fff' }} onClick={handleDeleteConfirm}>
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
