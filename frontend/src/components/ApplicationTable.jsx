import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Edit3, 
  Trash2, 
  ArrowUpRight, 
  Calendar, 
  Building2, 
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function ApplicationTable({
  applications = [],
  isLoading = false,
  onEdit,
  onChangeStatus,
  onDeleteRequest
}) {
  const navigate = useNavigate();

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    return new Date(dateVal).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="table-container" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#64748b' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading job applications...</span>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-icon">
            <Building2 size={28} />
          </div>
          <h3 className="empty-title">No applications found</h3>
          <p className="empty-description">
            No job applications match your current search and filter criteria. Try adjusting your filters or add a new application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>App ID</th>
              <th>Company & Role</th>
              <th>Type</th>
              <th>Applied Date</th>
              <th>Follow-up Window</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => {
              // Rule 11: Deletion is permitted ONLY when status is Applied or final (Rejected, Accepted, Declined).
              // Prevent deletion in Interview or Offer status.
              const isDeletable = app.canDelete !== undefined ? app.canDelete : ['Applied', 'Rejected', 'Accepted', 'Declined'].includes(app.status);

              return (
                <tr key={app._id || app.applicationId}>
                  <td>
                    <span 
                      className="app-id-pill" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/applications/${app.applicationId}`)}
                      title="View application details"
                    >
                      {app.applicationId}
                    </span>
                  </td>
                  <td>
                    <div className="company-cell">
                      <span 
                        className="company-name"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/applications/${app.applicationId}`)}
                      >
                        {app.company}
                      </span>
                      <span className="role-title">{app.role}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge-jobtype">{app.jobType}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>{formatDate(app.appliedDate)}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.85rem' }}>{formatDate(app.followUpDate)}</span>
                      {app.isOverdue && (
                        <span style={{ fontSize: '0.7rem', color: '#e11d48', fontWeight: 600 }}>
                          Past 7-day follow-up
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={app.status} isOverdue={app.isOverdue} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button 
                        type="button" 
                        className="btn-icon" 
                        title="View Details & Timeline"
                        onClick={() => navigate(`/applications/${app.applicationId}`)}
                      >
                        <Eye size={16} />
                      </button>

                      <button 
                        type="button" 
                        className="btn-icon" 
                        title="Change Status / Progress Milestone"
                        onClick={() => onChangeStatus(app)}
                      >
                        <ArrowUpRight size={16} />
                      </button>

                      <button 
                        type="button" 
                        className="btn-icon" 
                        title="Edit Details"
                        onClick={() => onEdit(app)}
                      >
                        <Edit3 size={16} />
                      </button>

                      <span title={!isDeletable ? `Cannot delete while in '${app.status}' status (Interview / Offer stages are protected)` : 'Delete Application'}>
                        <button 
                          type="button" 
                          className="btn-icon" 
                          style={{ color: isDeletable ? '#ef4444' : '#cbd5e1' }}
                          onClick={() => onDeleteRequest(app)}
                          disabled={!isDeletable}
                        >
                          <Trash2 size={16} />
                        </button>
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
