import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  AlertCircle,
  SlidersHorizontal
} from 'lucide-react';
import SummaryCards from '../components/SummaryCards';
import ApplicationTable from '../components/ApplicationTable';
import ApplicationFormModal from '../components/ApplicationFormModal';
import StatusChangeModal from '../components/StatusChangeModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { applicationService } from '../services/api';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const { addToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('-appliedDate');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [statusModalApp, setStatusModalApp] = useState(null);
  const [deleteModalApp, setDeleteModalApp] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formServerError, setFormServerError] = useState('');

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (jobTypeFilter && jobTypeFilter !== 'all') params.jobType = jobTypeFilter;
      if (sortBy) params.sort = sortBy;

      const res = await applicationService.getApplications(params);
      if (res.success && res.data) {
        setApplications(res.data.applications || []);
        setCounts(res.data.counts || {});
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError(err.message || 'Unable to connect to the backend server.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, jobTypeFilter, sortBy]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchApplications();
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [fetchApplications]);

  // Handle Create Application
  const handleCreateSubmit = async (payload) => {
    setIsSubmitting(true);
    setFormServerError('');
    try {
      const res = await applicationService.createApplication(payload);
      addToast(`Application for ${res.data.company} created successfully! (ID: ${res.data.applicationId})`, 'success');
      setIsAddModalOpen(false);
      fetchApplications();
    } catch (err) {
      setFormServerError(err.message || 'Failed to create application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Application
  const handleEditSubmit = async (payload) => {
    setIsSubmitting(true);
    setFormServerError('');
    try {
      await applicationService.updateApplication(editApp.applicationId, payload);
      addToast(`Application ${editApp.applicationId} updated successfully!`, 'success');
      setEditApp(null);
      fetchApplications();
    } catch (err) {
      setFormServerError(err.message || 'Failed to update application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Change
  const handleStatusChangeSubmit = async (appId, newStatus, notes) => {
    setIsSubmitting(true);
    setFormServerError('');
    try {
      await applicationService.updateStatus(appId, newStatus, notes);
      addToast(`Status for ${appId} changed to ${newStatus}!`, 'success');
      setStatusModalApp(null);
      fetchApplications();
    } catch (err) {
      setFormServerError(err.message || 'Invalid status transition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteModalApp) return;
    setIsSubmitting(true);
    try {
      await applicationService.deleteApplication(deleteModalApp.applicationId);
      addToast(`Application ${deleteModalApp.applicationId} has been deleted.`, 'info');
      setDeleteModalApp(null);
      fetchApplications();
    } catch (err) {
      addToast(err.message || 'Failed to delete application.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusTabs = [
    { id: '', label: 'All Applications', count: counts.total || 0 },
    { id: 'Applied', label: 'Applied', count: counts.Applied || 0 },
    { id: 'overdue', label: 'Overdue Follow-ups', count: counts.overdue || 0, isAlert: counts.overdue > 0 },
    { id: 'Interview', label: 'Interview', count: counts.Interview || 0 },
    { id: 'Offer', label: 'Offer', count: counts.Offer || 0 },
    { id: 'Accepted', label: 'Accepted', count: counts.Accepted || 0 },
    { id: 'Declined', label: 'Declined', count: counts.Declined || 0 },
    { id: 'Rejected', label: 'Rejected', count: counts.Rejected || 0 }
  ];

  return (
    <div className="page-wrapper">
      {/* Summary Cards */}
      <SummaryCards 
        counts={counts} 
        selectedStatus={statusFilter}
        onSelectStatus={(status) => setStatusFilter(status)}
      />

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={17} color="#94a3b8" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by company, role, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select 
            className="custom-select"
            value={jobTypeFilter}
            onChange={(e) => setJobTypeFilter(e.target.value)}
          >
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>

          <select 
            className="custom-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="-appliedDate">Applied: Newest First</option>
            <option value="appliedDate">Applied: Oldest First</option>
            <option value="company">Company: A to Z</option>
            <option value="-company">Company: Z to A</option>
          </select>

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={fetchApplications}
            title="Refresh application data"
          >
            <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Status Category Tabs */}
      <div className="status-tabs">
        {statusTabs.map(tab => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              className={`status-tab ${isActive ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
              style={tab.isAlert ? { borderColor: '#fda4af', color: isActive ? '#fff' : '#be123c' } : {}}
            >
              {tab.label}
              <span className="tab-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="alert-box alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: '0.4rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={fetchApplications}>
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applications Table */}
      <ApplicationTable 
        applications={applications}
        isLoading={isLoading}
        onEdit={(app) => {
          setFormServerError('');
          setEditApp(app);
        }}
        onChangeStatus={(app) => {
          setFormServerError('');
          setStatusModalApp(app);
        }}
        onDeleteRequest={(app) => setDeleteModalApp(app)}
      />

      {/* Add Application Modal */}
      <ApplicationFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormServerError('');
        }}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
        serverError={formServerError}
      />

      {/* Edit Application Modal */}
      <ApplicationFormModal
        isOpen={!!editApp}
        onClose={() => {
          setEditApp(null);
          setFormServerError('');
        }}
        onSubmit={handleEditSubmit}
        initialData={editApp}
        isEdit={true}
        isSubmitting={isSubmitting}
        serverError={formServerError}
      />

      {/* Status Change Modal */}
      <StatusChangeModal
        isOpen={!!statusModalApp}
        onClose={() => {
          setStatusModalApp(null);
          setFormServerError('');
        }}
        application={statusModalApp}
        onUpdateStatus={handleStatusChangeSubmit}
        isSubmitting={isSubmitting}
        serverError={formServerError}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteModalApp}
        onClose={() => setDeleteModalApp(null)}
        onConfirm={handleDeleteConfirm}
        itemDetails={deleteModalApp}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
