import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

export default function AdminSnackbar({ snackbars, onClose }) {
  return (
    <div className="admin-snackbar-container">
      <AnimatePresence>
        {snackbars.map((snack) => (
          <motion.div
            key={snack.id}
            className={`admin-snackbar ${snack.type || 'success'}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.22 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {snack.type === 'error' && <FiAlertTriangle style={{ fontSize: '1.2rem' }} />}
              {snack.type === 'info' && <FiInfo style={{ fontSize: '1.2rem' }} />}
              {(!snack.type || snack.type === 'success') && <FiCheckCircle style={{ fontSize: '1.2rem' }} />}
              <span>{snack.message}</span>
            </div>
            <button className="admin-snackbar-close" onClick={() => onClose(snack.id)}>
              <FiX />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
