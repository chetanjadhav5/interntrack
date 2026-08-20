import React from 'react';

const StatusBadge = ({ status, size = 'sm' }) => {
  const getBadgeConfig = () => {
    switch (status?.toUpperCase()) {
      case 'VERIFIED':
      case 'APPROVED':
      case 'ACCEPTED':
      case 'SELECTED':
      case 'COMPLETED':
      case 'CERTIFICATE_ISSUED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: status.replace(/_/g, ' ')
        };
      case 'PENDING':
      case 'SUBMITTED':
      case 'APPLIED':
      case 'IN_PROGRESS':
      case 'WEEKLY_REVIEW_ONGOING':
      case 'VERIFICATION_PENDING':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: status.replace(/_/g, ' ')
        };
      case 'CORRECTION_REQUIRED':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          dot: 'bg-orange-500',
          label: 'Correction Required'
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Rejected'
        };
      case 'ACTIVE':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          label: 'Active'
        };
      case 'CLOSED':
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
          label: 'Closed'
        };
      case 'DRAFT':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          label: 'Draft'
        };
      case 'GD':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
          label: 'GD Round'
        };
      case 'INTERVIEW':
        return {
          bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          dot: 'bg-cyan-500',
          label: 'Interview Round'
        };
      default:
        return {
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
          label: status || 'Unknown'
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full border capitalize ${config.bg} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
