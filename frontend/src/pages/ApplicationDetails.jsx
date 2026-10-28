import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  DollarSign, 
  Building2, 
  Briefcase, 
  Edit3, 
  Trash2, 
  ArrowUpRight, 
  AlertCircle,
  History,
  CheckCircle2,
  FileText,
  AlertTriangle
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ApplicationFormModal from '../components/ApplicationFormModal';
import StatusChangeModal from '../components/StatusChangeModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { applicationService } from '../services/api';
import { useToast } from '../components/Toast';

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const fetchApplicationDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await applicationService.getApplication(id);
      if (res.success && res.data) {
        setApplication(res.data);
      }
    } catch (err) {
      console.error('Failed to load application:', err);
      setError(err.message || `Application "${id}" not found.`);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplicationDetails();
  }, [fetchApplicationDetails]);

  const handleEditSubmit = async (payload) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      await applicationService.updateApplication(application.applicationId, payload);
      addToast('Application details updated successfully.', 'success');
      setIsEditOpen(false);
      fetchApplicationDetails();
    } catch (err) {
      setServerError(err.message || 'Failed to update application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusSubmit = async (appId, newStatus, notes) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      await applicationService.updateStatus(appId, newStatus, notes);
      addToast(`Status updated to ${newStatus}.`, 'success');
      setIsStatusOpen(false);
      fetchApplicationDetails();
    } catch (err) {
      setServerError(err.message || 'Status transition rejected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await applicationService.deleteApplication(application.applicationId);
      addToast(`Application ${application.applicationId} deleted successfully.`, 'info');
      navigate('/');
    } catch (err) {
      addToast(err.message || 'Failed to delete application.', 'error');
      setIsDeleteOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#64748b' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%' }} />
          <span>Loading application timeline...</span>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="page-wrapper">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')} style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div className="alert-box alert-error">
          <AlertCircle size={22} />
          <div>
            <strong>Unable to load application:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  const isDeletable = application.canDelete !== undefined ? application.canDelete : ['Applied', 'Rejected', 'Accepted', 'Declined'].includes(application.status);

  return (
    <div className="page-wrapper">
      {/* Top back navigation and actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Applications
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => {
              setServerError('');
              setIsStatusOpen(true);
            }}
          >
            <ArrowUpRight size={15} />
            Advance / Change Status
          </button>

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => {
              setServerError('');
              setIsEditOpen(true);
            }}
          >
            <Edit3 size={15} />
            Edit
          </button>

          <span title={!isDeletable ? `Applications in "${application.status}" status cannot be deleted.` : 'Delete application'}>
            <button 
              className="btn btn-danger btn-sm" 
              onClick={() => setIsDeleteOpen(true)}
              disabled={!isDeletable}
            >
              <Trash2 size={15} />
              Delete
            </button>
          </span>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="details-header-card">
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div className="details-title-row">
            <span className="app-id-pill" style={{ fontSize: '0.9rem', padding: '0.3rem 0.65rem' }}>
              {application.applicationId}
            </span>
            <StatusBadge status={application.status} isOverdue={application.isOverdue} />
          </div>

          <h2 className="details-company-title">{application.company}</h2>
          <div style={{ fontSize: '1.15rem', color: '#475569', fontWeight: 600, marginTop: '0.2rem' }}>
            {application.role}
          </div>

          {application.notes && (
            <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={13} /> Notes & Context
              </div>
              <p style={{ fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{application.notes}</p>
            </div>
          )}

          <div className="details-grid">
            <div>
              <div className="info-item-label">Employment Type</div>
              <div className="info-item-value">
                <span className="badge-jobtype" style={{ fontSize: '0.825rem' }}>{application.jobType}</span>
              </div>
            </div>

            <div>
              <div className="info-item-label">Expected Salary</div>
              <div className="info-item-value">
                {application.expectedSalary ? `$${Number(application.expectedSalary).toLocaleString()} / year` : 'Not specified'}
              </div>
            </div>

            <div>
              <div className="info-item-label">Applied Date</div>
              <div className="info-item-value">{formatDate(application.appliedDate)}</div>
            </div>

            <div>
              <div className="info-item-label">Follow-up Target (+7 Days)</div>
              <div className="info-item-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{formatDate(application.followUpDate)}</span>
                {application.isOverdue && (
                  <span className="badge-overdue" style={{ fontSize: '0.65rem' }}>Overdue</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status History Timeline Card */}
      <div className="timeline-card">
        <div className="timeline-card-header">
          <div className="timeline-title">
            <History size={20} color="#2563eb" />
            <span>Application Status Timeline</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
            {application.statusHistory?.length || 0} milestone{application.statusHistory?.length === 1 ? '' : 's'} recorded
          </span>
        </div>

        <div className="timeline">
          {application.statusHistory && application.statusHistory.map((entry, idx) => (
            <div key={entry._id || idx} className="timeline-item">
              <div className="timeline-node" />
              <div className="timeline-content">
                <div className="timeline-content-top">
                  <div>
                    <StatusBadge status={entry.status} showOverdue={false} />
                  </div>
                  <div className="timeline-time">
                    <Clock size={13} />
                    <span>{formatDateTime(entry.changedAt)}</span>
                  </div>
                </div>

                <div className="timeline-notes">
                  {entry.notes || `Application progressed to ${entry.status}.`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      <ApplicationFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={application}
        isEdit={true}
        isSubmitting={isSubmitting}
        serverError={serverError}
      />

      {/* Status Modal */}
      <StatusChangeModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        application={application}
        onUpdateStatus={handleStatusSubmit}
        isSubmitting={isSubmitting}
        serverError={serverError}
      />

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemDetails={application}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
