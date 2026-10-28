const STATUS = {
  APPLIED: 'Applied',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined'
};

const ALL_STATUSES = Object.values(STATUS);

const ALLOWED_TRANSITIONS = {
  [STATUS.APPLIED]: [STATUS.INTERVIEW, STATUS.REJECTED],
  [STATUS.INTERVIEW]: [STATUS.OFFER, STATUS.REJECTED],
  [STATUS.OFFER]: [STATUS.ACCEPTED, STATUS.DECLINED],
  [STATUS.REJECTED]: [],
  [STATUS.ACCEPTED]: [],
  [STATUS.DECLINED]: []
};

const FINAL_STATUSES = [STATUS.REJECTED, STATUS.ACCEPTED, STATUS.DECLINED];
const ACTIVE_STATUSES = [STATUS.APPLIED, STATUS.INTERVIEW, STATUS.OFFER];
const DELETABLE_STATUSES = [STATUS.APPLIED, ...FINAL_STATUSES];

/**
 * Returns allowed next statuses for a given status.
 */
function getValidNextStatuses(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

/**
 * Validates if status transition from currentStatus to targetStatus is allowed.
 */
function canTransition(currentStatus, targetStatus) {
  const allowed = getValidNextStatuses(currentStatus);
  return allowed.includes(targetStatus);
}

/**
 * Checks whether an application can be deleted based on its status.
 * Permitted only when status is Applied, Rejected, Accepted, or Declined.
 * Forbidden when in Interview or Offer.
 */
function canDeleteApplication(status) {
  return DELETABLE_STATUSES.includes(status);
}

/**
 * Computes followUpDate (appliedDate + 7 calendar days) and isOverdue flag.
 */
function computeFollowUpInfo(appliedDate, currentStatus) {
  const dateObj = new Date(appliedDate);
  const followUpDate = new Date(dateObj.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const isOverdue = currentStatus === STATUS.APPLIED && now > followUpDate;

  return {
    followUpDate,
    isOverdue
  };
}

module.exports = {
  STATUS,
  ALL_STATUSES,
  ALLOWED_TRANSITIONS,
  FINAL_STATUSES,
  ACTIVE_STATUSES,
  DELETABLE_STATUSES,
  getValidNextStatuses,
  canTransition,
  canDeleteApplication,
  computeFollowUpInfo
};
