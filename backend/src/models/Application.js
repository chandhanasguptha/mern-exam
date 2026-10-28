const mongoose = require('mongoose');
const { STATUS, ALL_STATUSES, computeFollowUpInfo, getValidNextStatuses, canDeleteApplication } = require('../utils/statusRules');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ALL_STATUSES,
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: true });

const applicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  role: {
    type: String,
    required: [true, 'Job role is required'],
    trim: true
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: {
      values: ['Full-time', 'Internship', 'Contract'],
      message: '{VALUE} is not a valid job type. Allowed: Full-time, Internship, Contract'
    },
    default: 'Full-time'
  },
  appliedDate: {
    type: Date,
    required: [true, 'Applied date is required'],
    validate: {
      validator: function (value) {
        // Must not be in the future (allowing slight clock drift of 1 minute)
        return value <= new Date(Date.now() + 60000);
      },
      message: 'Applied date cannot be in the future'
    }
  },
  expectedSalary: {
    type: Number,
    min: [0, 'Expected salary must be a positive number'],
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ALL_STATUSES,
    default: STATUS.APPLIED,
    required: true
  },
  statusHistory: [statusHistorySchema],
  followUpDate: {
    type: Date,
    required: true
  },
  // Normalized fields for reliable case/whitespace-insensitive duplicate checks
  normalizedCompany: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  normalizedRole: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for fast duplicate checks and queries
applicationSchema.index({ normalizedCompany: 1, normalizedRole: 1, status: 1 });
applicationSchema.index({ status: 1 });

// Virtual for dynamic isOverdue calculation
applicationSchema.virtual('isOverdue').get(function () {
  const { isOverdue } = computeFollowUpInfo(this.appliedDate, this.status);
  return isOverdue;
});

// Virtual for valid next statuses
applicationSchema.virtual('validNextStatuses').get(function () {
  return getValidNextStatuses(this.status);
});

// Virtual for canDelete check
applicationSchema.virtual('canDelete').get(function () {
  return canDeleteApplication(this.status);
});

module.exports = mongoose.model('Application', applicationSchema);
