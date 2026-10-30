import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUserPlus, FiShield, FiTrash2, FiUser, FiX, FiLock, FiAlertCircle, FiCheck, FiKey } from 'react-icons/fi';

export default function AdminStaff({ onShowSnackbar }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('staff');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create user');
      }

      setShowAddModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewRole('staff');
      if (onShowSnackbar) onShowSnackbar(`Team member "${newUsername}" created successfully!`, 'success');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${username}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || 'Could not delete user');
        return;
      }
      if (onShowSnackbar) onShowSnackbar(`Access revoked for ${username}`, 'info');
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3 className="admin-panel-title">
              <FiShield style={{ color: 'var(--md-primary)' }} />
              Team & System Access Control
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)', marginTop: '0.2rem', display: 'inline-block' }}>
              Manage quote specialists, intake managers, and system administrator accounts
            </span>
          </div>

          <button className="admin-btn-primary" onClick={() => setShowAddModal(true)}>
            <FiUserPlus /> Add Team Member
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Access Level</th>
                <th>Security Scope</th>
                <th>Account Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--md-on-surface-variant)', padding: '2.5rem' }}>
                    Loading staff directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--md-on-surface-variant)', padding: '2.5rem' }}>
                    No staff members found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-profile" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                        <div className="admin-avatar">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="admin-user-info">
                          <span className="admin-user-name">{user.username}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}>ID: #{user.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${user.role === 'admin' ? 'qualified' : 'new'}`}>
                        {user.role === 'admin' ? 'Super Admin' : 'Lead Specialist'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)' }}>
                        {user.role === 'admin' ? 'Full Read / Write / User Admin' : 'Lead Intake & Qualification Only'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="admin-action-btn delete"
                        title="Revoke User Access"
                        onClick={() => handleDeleteUser(user.id, user.username)}
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
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="admin-modal-overlay">
            <motion.div
              className="admin-modal-content"
              style={{ maxWidth: '460px' }}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
            >
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Create New Team Account</h3>
                <button className="admin-modal-close" onClick={() => setShowAddModal(false)}>
                  <FiX />
                </button>
              </div>

              {error && (
                <div className="admin-error-banner">
                  <FiAlertCircle />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Username *</label>
                  <div className="admin-input-wrapper">
                    <FiUser className="admin-input-icon" />
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g. sarah_quotes"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Password *</label>
                  <div className="admin-input-wrapper">
                    <FiLock className="admin-input-icon" />
                    <input
                      type="password"
                      className="admin-input"
                      placeholder="Enter secure temporary password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Role & Permissions</label>
                  <select
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="staff">Staff (Lead Manager & Qualification)</option>
                    <option value="admin">Super Admin (Full Platform Control)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                  <button type="button" className="admin-btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn-primary" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
