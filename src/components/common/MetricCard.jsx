import React from 'react';

const MetricCard = ({ title, value, icon, change, trend = 'up', color = 'primary' }) => {
  const getColorStyles = () => {
    switch (color) {
      case 'primary':
        return { bg: 'bg-blue-50', text: 'text-primary', border: 'border-blue-100' };
      case 'secondary':
        return { bg: 'bg-teal-50', text: 'text-secondary', border: 'border-teal-100' };
      case 'success':
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' };
      case 'warning':
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' };
      case 'purple':
        return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' };
      default:
        return { bg: 'bg-surface-container-high', text: 'text-on-surface', border: 'border-outline-variant' };
    }
  };

  const style = getColorStyles();

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/60 shadow-sm hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{title}</span>
        <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.border} border flex items-center justify-center ${style.text}`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">{value}</h3>
        {change && (
          <span
            className={`inline-flex items-center text-xs font-bold ${
              trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend === 'up' ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
