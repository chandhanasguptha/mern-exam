import React, { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import StatusBadge, { STATUS_CONFIG } from './StatusBadge';

export default function StatusChangeModal({
  isOpen,
  onClose,
  application,
  onUpdateStatus,
  isSubmitting = false,
  serverError = ''
}) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');

  // Valid next statuses from backend virtual or computed
  const validNext = application?.validNextStatuses || [];
  const isFinalStatus = validNext.length === 0;

  useEffect(() => {
    if (validNext.length > 0) {
      setSelectedStatus(validNext[0]);
    } else {
      setSelectedStatus('');
    }
    setNotes('');
  }, [application, isOpen]);

  if (!isOpen || !application) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStatus) return;
    onUpdateStatus(application.applicationId, selectedStatus, notes);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Update Application Status</h2>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {application.company} - {application.role} ({application.applicationId})
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {serverError && (
              <div className="alert-box alert-error">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{serverError}</div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Current Stage</span>
                <div><StatusBadge status={application.status} isOverdue={application.isOverdue} /></div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
              <div>
                <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Next Milestone</span>
                <div>
                  {selectedStatus ? (
                    <StatusBadge status={selectedStatus} showOverdue={false} />
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>None available</span>
                  )}
                </div>
              </div>
            </div>

            {isFinalStatus ? (
              <div className="alert-box" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Final Status Reached:</strong> Applications marked as {application.status} cannot be transitioned to any further stage per workflow rules.
                </div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Select Permitted Next Status</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    {validNext.map(stat => {
                      const isSelected = selectedStatus === stat;
                      const conf = STATUS_CONFIG[stat];
                      const Icon = conf?.icon || CheckCircle2;
                      return (
                        <button
                          key={stat}
                          type="button"
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ justifyContent: 'center', padding: '0.75rem 0.5rem', height: 'auto' }}
                          onClick={() => setSelectedStatus(stat)}
                          disabled={isSubmitting}
                        >
                          <Icon size={16} />
                          {stat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Milestone Notes / Feedback (Optional)</label>
                  <textarea
                    rows="3"
                    className="form-textarea"
                    placeholder="e.g. Cleared round 1 coding assessment; Offer package details; Rejection feedback"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </>
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
            {!isFinalStatus && (
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting || !selectedStatus}
              >
                {isSubmitting ? 'Updating...' : 'Confirm Status Change'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
