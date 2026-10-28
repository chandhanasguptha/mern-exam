import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this job application? This action cannot be undone.',
  itemDetails = null,
  isSubmitting = false
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} />
            </div>
            <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>{title}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: itemDetails ? '1rem' : 0 }}>
            {message}
          </p>

          {itemDetails && (
            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{itemDetails.company}</div>
              <div style={{ color: '#64748b' }}>{itemDetails.role} &bull; <span style={{ fontFamily: 'var(--font-mono)' }}>{itemDetails.applicationId}</span></div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            <Trash2 size={15} />
            {isSubmitting ? 'Deleting...' : 'Delete Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
