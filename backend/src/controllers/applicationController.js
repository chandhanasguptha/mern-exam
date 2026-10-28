const mongoose = require('mongoose');
const Application = require('../models/Application');
const { generateApplicationId } = require('../utils/idGenerator');
const {
  STATUS,
  ALL_STATUSES,
  ACTIVE_STATUSES,
  canTransition,
  getValidNextStatuses,
  canDeleteApplication,
  computeFollowUpInfo
} = require('../utils/statusRules');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Helper to find application by either MongoDB _id or custom applicationId
 */
async function findAppByIdOrAppId(idParam) {
  let app = null;
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    app = await Application.findById(idParam);
  }
  if (!app) {
    app = await Application.findOne({ applicationId: idParam.toUpperCase().trim() });
  }
  return app;
}

/**
 * Calculates counts for all statuses and overdue applications
 */
async function computeStatusCounts() {
  const now = new Date();
  const [countsAggregation, overdueCount] = await Promise.all([
    Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    Application.countDocuments({
      status: STATUS.APPLIED,
      followUpDate: { $lt: now }
    })
  ]);

  const counts = {
    total: 0,
    [STATUS.APPLIED]: 0,
    [STATUS.INTERVIEW]: 0,
    [STATUS.OFFER]: 0,
    [STATUS.REJECTED]: 0,
    [STATUS.ACCEPTED]: 0,
    [STATUS.DECLINED]: 0,
    overdue: overdueCount
  };

  countsAggregation.forEach(item => {
    if (counts[item._id] !== undefined) {
      counts[item._id] = item.count;
    }
    counts.total += item.count;
  });

  return counts;
}

/**
 * POST /api/applications
 * Create a new application
 */
exports.createApplication = async (req, res, next) => {
  try {
    const { company, role, jobType = 'Full-time', appliedDate, expectedSalary, notes } = req.body;

    // Validate required fields
    if (!company || typeof company !== 'string' || !company.trim()) {
      throw new ApiError(400, 'Company Name is required.');
    }
    if (!role || typeof role !== 'string' || !role.trim()) {
      throw new ApiError(400, 'Job Role is required.');
    }
    if (!appliedDate) {
      throw new ApiError(400, 'Applied Date is required.');
    }

    const parsedAppliedDate = new Date(appliedDate);
    if (isNaN(parsedAppliedDate.getTime())) {
      throw new ApiError(400, 'Applied Date must be a valid date.');
    }

    // Must not be in the future (allowing 1 min tolerance for clock drift)
    if (parsedAppliedDate > new Date(Date.now() + 60000)) {
      throw new ApiError(400, 'Applied Date cannot be in the future.');
    }

    const trimmedCompany = company.trim();
    const trimmedRole = role.trim();
    const normalizedCompany = trimmedCompany.toLowerCase();
    const normalizedRole = trimmedRole.toLowerCase();

    // Check duplicate active application for same company and role
    const existingActive = await Application.findOne({
      normalizedCompany,
      normalizedRole,
      status: { $in: ACTIVE_STATUSES }
    });

    if (existingActive) {
      throw new ApiError(
        409,
        `An active application for "${trimmedRole}" at "${trimmedCompany}" already exists (ID: ${existingActive.applicationId}, Status: ${existingActive.status}). Finalize that application first.`
      );
    }

    // Calculate follow-up date (Applied Date + 7 days)
    const { followUpDate } = computeFollowUpInfo(parsedAppliedDate, STATUS.APPLIED);

    // Concurrency-safe generation of Application ID
    const applicationId = await generateApplicationId(trimmedCompany);

    // Initial status history entry
    const initialHistory = [{
      status: STATUS.APPLIED,
      changedAt: parsedAppliedDate,
      notes: notes ? `Initial application: ${notes.substring(0, 80)}` : 'Application created'
    }];

    const newApp = new Application({
      applicationId,
      company: trimmedCompany,
      role: trimmedRole,
      jobType,
      appliedDate: parsedAppliedDate,
      expectedSalary: expectedSalary ? Number(expectedSalary) : null,
      notes: notes ? notes.trim() : '',
      status: STATUS.APPLIED,
      statusHistory: initialHistory,
      followUpDate,
      normalizedCompany,
      normalizedRole
    });

    await newApp.save();

    res.status(201).json({
      success: true,
      message: 'Application created successfully.',
      data: newApp
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/applications
 * Get applications with search, status filtering, and count summary
 */
exports.getAllApplications = async (req, res, next) => {
  try {
    const { search, status, jobType, sort = '-appliedDate' } = req.query;

    const query = {};

    // Search by company or role (case-insensitive substring)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { company: searchRegex },
        { role: searchRegex },
        { applicationId: searchRegex }
      ];
    }

    // Status filter
    if (status && status !== 'all' && status !== 'All') {
      if (status.toLowerCase() === 'overdue') {
        query.status = STATUS.APPLIED;
        query.followUpDate = { $lt: new Date() };
      } else if (ALL_STATUSES.includes(status)) {
        query.status = status;
      }
    }

    // Job type filter
    if (jobType && jobType !== 'all' && jobType !== 'All') {
      query.jobType = jobType;
    }

    const applications = await Application.find(query).sort(sort);
    const counts = await computeStatusCounts();

    res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully.',
      data: {
        applications,
        counts,
        totalFiltered: applications.length
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/applications/stats
 * Get breakdown of application counts
 */
exports.getStats = async (req, res, next) => {
  try {
    const counts = await computeStatusCounts();
    res.status(200).json({
      success: true,
      message: 'Application statistics retrieved successfully.',
      data: counts
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/applications/:id
 * Get single application details
 */
exports.getApplicationById = async (req, res, next) => {
  try {
    const app = await findAppByIdOrAppId(req.params.id);
    if (!app) {
      throw new ApiError(404, `Application not found with ID: ${req.params.id}`);
    }

    res.status(200).json({
      success: true,
      message: 'Application details retrieved.',
      data: app
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/applications/:id
 * Edit application fields: company, role, jobType, salary, notes.
 * Explicitly rejects editing applicationId or appliedDate.
 */
exports.updateApplication = async (req, res, next) => {
  try {
    const app = await findAppByIdOrAppId(req.params.id);
    if (!app) {
      throw new ApiError(404, `Application not found with ID: ${req.params.id}`);
    }

    const { company, role, jobType, expectedSalary, notes, applicationId, appliedDate } = req.body;

    // Check if client tried to change locked fields
    if (applicationId && applicationId !== app.applicationId) {
      throw new ApiError(400, 'Application ID cannot be edited after creation.');
    }
    if (appliedDate) {
      const incomingDate = new Date(appliedDate).toISOString().split('T')[0];
      const existingDate = new Date(app.appliedDate).toISOString().split('T')[0];
      if (incomingDate !== existingDate) {
        throw new ApiError(400, 'Applied Date cannot be edited after creation.');
      }
    }

    const targetCompany = company !== undefined ? company.trim() : app.company;
    const targetRole = role !== undefined ? role.trim() : app.role;

    if (!targetCompany) {
      throw new ApiError(400, 'Company Name cannot be empty.');
    }
    if (!targetRole) {
      throw new ApiError(400, 'Job Role cannot be empty.');
    }

    const targetNormCompany = targetCompany.toLowerCase();
    const targetNormRole = targetRole.toLowerCase();

    // If company or role changed, ensure no duplicate active application exists
    if (targetNormCompany !== app.normalizedCompany || targetNormRole !== app.normalizedRole) {
      const conflict = await Application.findOne({
        _id: { $ne: app._id },
        normalizedCompany: targetNormCompany,
        normalizedRole: targetNormRole,
        status: { $in: ACTIVE_STATUSES }
      });

      if (conflict) {
        throw new ApiError(
          409,
          `An active application for "${targetRole}" at "${targetCompany}" already exists (ID: ${conflict.applicationId}). Cannot rename.`
        );
      }

      app.company = targetCompany;
      app.role = targetRole;
      app.normalizedCompany = targetNormCompany;
      app.normalizedRole = targetNormRole;
    }

    if (jobType !== undefined) {
      if (!['Full-time', 'Internship', 'Contract'].includes(jobType)) {
        throw new ApiError(400, 'Invalid job type. Allowed: Full-time, Internship, Contract.');
      }
      app.jobType = jobType;
    }

    if (expectedSalary !== undefined) {
      if (expectedSalary === null || expectedSalary === '') {
        app.expectedSalary = null;
      } else {
        const salaryNum = Number(expectedSalary);
        if (isNaN(salaryNum) || salaryNum < 0) {
          throw new ApiError(400, 'Expected Salary must be a positive number.');
        }
        app.expectedSalary = salaryNum;
      }
    }

    if (notes !== undefined) {
      app.notes = notes.trim();
    }

    await app.save();

    res.status(200).json({
      success: true,
      message: 'Application updated successfully.',
      data: app
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/applications/:id/status
 * Change application status with business transition validation
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status: targetStatus, notes = '' } = req.body;

    if (!targetStatus) {
      throw new ApiError(400, 'Target status is required.');
    }

    const app = await findAppByIdOrAppId(req.params.id);
    if (!app) {
      throw new ApiError(404, `Application not found with ID: ${req.params.id}`);
    }

    const currentStatus = app.status;
    const allowed = getValidNextStatuses(currentStatus);

    if (!canTransition(currentStatus, targetStatus)) {
      const allowedMsg = allowed.length > 0 ? allowed.join(', ') : 'None (final status reached)';
      throw new ApiError(
        400,
        `Invalid status change: Cannot transition from "${currentStatus}" to "${targetStatus}". Allowed next transitions: [${allowedMsg}].`,
        { currentStatus, validNextStatuses: allowed }
      );
    }

    // Update status and append to history
    app.status = targetStatus;
    app.statusHistory.push({
      status: targetStatus,
      changedAt: new Date(),
      notes: notes ? notes.trim() : `Status changed to ${targetStatus}`
    });

    await app.save();

    res.status(200).json({
      success: true,
      message: `Status successfully updated to ${targetStatus}.`,
      data: app
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/applications/:id
 * Deletion is permitted ONLY when status is Applied or final (Rejected, Accepted, Declined).
 * Forbidden when in Interview or Offer status.
 */
exports.deleteApplication = async (req, res, next) => {
  try {
    const app = await findAppByIdOrAppId(req.params.id);
    if (!app) {
      throw new ApiError(404, `Application not found with ID: ${req.params.id}`);
    }

    if (!canDeleteApplication(app.status)) {
      throw new ApiError(
        400,
        `Deletion forbidden: Applications in "${app.status}" status cannot be deleted. Deletion is permitted only when status is "Applied" or a final status ("Rejected", "Accepted", "Declined").`
      );
    }

    const deletedId = app.applicationId;
    await Application.deleteOne({ _id: app._id });

    res.status(200).json({
      success: true,
      message: `Application ${deletedId} deleted successfully.`,
      data: { applicationId: deletedId }
    });
  } catch (err) {
    next(err);
  }
};
