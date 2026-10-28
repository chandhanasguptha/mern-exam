import React from 'react';
import { 
  Briefcase, 
  Clock, 
  UserCheck, 
  Gift, 
  CheckCheck,
  AlertTriangle 
} from 'lucide-react';

export default function SummaryCards({ counts = {}, selectedStatus, onSelectStatus }) {
  const cards = [
    {
      id: 'all',
      title: 'Total Applications',
      value: counts.total || 0,
      subtext: 'Across all stages',
      icon: Briefcase,
      color: '#2563eb',
      bg: '#eff6ff'
    },
    {
      id: 'Applied',
      title: 'Applied (Waiting)',
      value: counts.Applied || 0,
      subtext: counts.overdue > 0 ? `${counts.overdue} overdue for follow-up` : 'Within 7-day window',
      icon: counts.overdue > 0 ? AlertTriangle : Clock,
      color: counts.overdue > 0 ? '#e11d48' : '#0284c7',
      bg: counts.overdue > 0 ? '#ffe4e6' : '#e0f2fe',
      isOverdueHighlight: counts.overdue > 0
    },
    {
      id: 'Interview',
      title: 'In Interview',
      value: counts.Interview || 0,
      subtext: 'Active interview rounds',
      icon: UserCheck,
      color: '#d97706',
      bg: '#fef3c7'
    },
    {
      id: 'Offer',
      title: 'Offers Extended',
      value: counts.Offer || 0,
      subtext: 'Awaiting decision',
      icon: Gift,
      color: '#16a34a',
      bg: '#dcfce7'
    },
    {
      id: 'Accepted',
      title: 'Accepted Offers',
      value: counts.Accepted || 0,
      subtext: `${counts.Rejected || 0} rejected, ${counts.Declined || 0} declined`,
      icon: CheckCheck,
      color: '#059669',
      bg: '#ecfdf5'
    }
  ];

  return (
    <div className="summary-grid">
      {cards.map(card => {
        const Icon = card.icon;
        const isActive = (selectedStatus === card.id) || (card.id === 'all' && (!selectedStatus || selectedStatus === 'all'));

        return (
          <div 
            key={card.id} 
            className={`summary-card ${isActive ? 'active-filter' : ''}`}
            onClick={() => onSelectStatus(card.id === 'all' ? '' : card.id)}
            role="button"
            tabIndex={0}
          >
            <div className="summary-card-top">
              <span className="summary-card-title">{card.title}</span>
              <div className="summary-icon-box" style={{ backgroundColor: card.bg, color: card.color }}>
                <Icon size={19} />
              </div>
            </div>
            <div className="summary-card-bottom">
              <span className="summary-card-value" style={{ color: card.isOverdueHighlight ? '#e11d48' : undefined }}>
                {card.value}
              </span>
              <span className="summary-card-subtext" style={{ color: card.isOverdueHighlight ? '#be123c' : undefined }}>
                {card.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
