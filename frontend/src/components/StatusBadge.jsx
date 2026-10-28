import React from 'react';
import { 
  Clock, 
  UserCheck, 
  Gift, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  AlertTriangle 
} from 'lucide-react';

export const STATUS_CONFIG = {
  Applied: {
    label: 'Applied',
    className: 'applied',
    icon: Clock
  },
  Interview: {
    label: 'Interview',
    className: 'interview',
    icon: UserCheck
  },
  Offer: {
    label: 'Offer',
    className: 'offer',
    icon: Gift
  },
  Accepted: {
    label: 'Accepted',
    className: 'accepted',
    icon: CheckCircle
  },
  Declined: {
    label: 'Declined',
    className: 'declined',
    icon: MinusCircle
  },
  Rejected: {
    label: 'Rejected',
    className: 'rejected',
    icon: XCircle
  }
};

export default function StatusBadge({ status, isOverdue = false, showOverdue = true }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: 'applied',
    icon: Clock
  };
  const Icon = config.icon;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
      <span className={`status-badge ${config.className}`}>
        <Icon size={13} strokeWidth={2.4} />
        {config.label}
      </span>
      {showOverdue && isOverdue && (
        <span className="badge-overdue" title="No response for over 7 calendar days since application">
          <AlertTriangle size={12} strokeWidth={2.5} />
          Overdue
        </span>
      )}
    </div>
  );
}
