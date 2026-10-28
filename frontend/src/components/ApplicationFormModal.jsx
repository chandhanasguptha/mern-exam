import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Building2, Briefcase, DollarSign, Calendar, FileText, Check } from 'lucide-react';

export default function ApplicationFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  isEdit = false,
  isSubmitting = false,
  serverError = ''
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    company: '',
    role: '',
    jobType: 'Full-time',
    appliedDate: todayStr,
    expectedSalary: '',
    notes: ''
  });

  const [clientErrors, setClientErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        company: initialData.company || '',
        role: initialData.role || '',
        jobType: initialData.jobType || 'Full-time',
        appliedDate: initialData.appliedDate 
          ? new Date(initialData.appliedDate).toISOString().split('T')[0] 
          : todayStr,
        expectedSalary: initialData.expectedSalary !== null && initialData.expectedSalary !== undefined 
          ? String(initialData.expectedSalary) 
          : '',
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        company: '',
        role: '',
        jobType: 'Full-time',
        appliedDate: todayStr,
        expectedSalary: '',
        notes: ''
      });
    }
    setClientErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errors = {};
    if (!formData.company.trim()) {
      errors.company = 'Company name is required';
    }
    if (!formData.role.trim()) {
      errors.role = 'Job role is required';
    }
    if (!isEdit) {
      if (!formData.appliedDate) {
        errors.appliedDate = 'Applied date is required';
      } else if (new Date(formData.appliedDate) > new Date()) {
        errors.appliedDate = 'Applied date cannot be in the future';
      }
    }
    if (formData.expectedSalary && (isNaN(Number(formData.expectedSalary)) || Number(formData.expectedSalary) < 0)) {
      errors.expectedSalary = 'Expected salary must be a positive number';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      company: formData.company.trim(),
      role: formData.role.trim(),
      jobType: formData.jobType,
      expectedSalary: formData.expectedSalary ? Number(formData.expectedSalary) : null,
      notes: formData.notes.trim()
    };

    if (!isEdit) {
      payload.appliedDate = formData.appliedDate;
    }

    onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {isEdit ? `Edit Application (${initialData?.applicationId})` : 'New Job Application'}
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {isEdit ? 'Update role details and expectations' : 'Track a newly submitted job application'}
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
                <div>
                  <div style={{ fontWeight: 600 }}>Error Saving Application</div>
                  <div>{serverError}</div>
                </div>
              </div>
            )}

            {isEdit && (
              <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Application ID:</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2563eb' }}>{initialData?.applicationId}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Applied On:</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{new Date(initialData?.appliedDate).toLocaleDateString()}</div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Company Name <span className="required-star">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Google, Microsoft, Infosys"
                  className={`form-input ${clientErrors.company ? 'input-error' : ''}`}
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              {clientErrors.company && (
                <div className="field-error">
                  <AlertCircle size={13} /> {clientErrors.company}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Job Role <span className="required-star">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Full Stack Developer, Frontend Engineer"
                className={`form-input ${clientErrors.role ? 'input-error' : ''}`}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={isSubmitting}
              />
              {clientErrors.role && (
                <div className="field-error">
                  <AlertCircle size={13} /> {clientErrors.role}
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Job Type <span className="required-star">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.jobType}
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Applied Date {!isEdit && <span className="required-star">*</span>}
                </label>
                <input
                  type="date"
                  max={todayStr}
                  className={`form-input ${clientErrors.appliedDate ? 'input-error' : ''}`}
                  value={formData.appliedDate}
                  onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                  disabled={isEdit || isSubmitting}
                  style={isEdit ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                />
                {isEdit && (
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Cannot be modified after creation</span>
                )}
                {clientErrors.appliedDate && (
                  <div className="field-error">
                    <AlertCircle size={13} /> {clientErrors.appliedDate}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Expected Annual Salary (USD, Optional)</label>
              <input
                type="number"
                placeholder="e.g. 95000"
                min="0"
                step="1000"
                className={`form-input ${clientErrors.expectedSalary ? 'input-error' : ''}`}
                value={formData.expectedSalary}
                onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                disabled={isSubmitting}
              />
              {clientErrors.expectedSalary && (
                <div className="field-error">
                  <AlertCircle size={13} /> {clientErrors.expectedSalary}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes & Follow-up Context (Optional)</label>
              <textarea
                rows="3"
                placeholder="Referral name, job link, recruiter contact info, etc."
                className="form-textarea"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
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
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Check size={16} />
                  {isEdit ? 'Update Application' : 'Create Application'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
