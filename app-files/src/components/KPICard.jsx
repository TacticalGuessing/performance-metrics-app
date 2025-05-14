// src/components/KPICard.jsx
'use client'; 

import React from 'react';

// Helper function to determine color based on status and value
const getStatusColor = (status, value, unit) => {
  if (status === 'N/A' || value === null || value === undefined) {
    return {
      bg: 'bg-gray-700/60 border border-gray-600',
      text: 'text-gray-300',
      bar: 'bg-gray-500',
      indicator: 'text-gray-400'
    };
  }
  switch (status.toLowerCase()) {
    case 'good':
      return { 
        bg: 'bg-emerald-600/40 border border-emerald-500/70', 
        text: 'text-emerald-300', 
        bar: 'bg-emerald-500',
        indicator: 'text-emerald-400' 
      };
    case 'ok':
      return { 
        bg: 'bg-amber-600/40 border border-amber-500/70', 
        text: 'text-amber-300', 
        bar: 'bg-amber-500',
        indicator: 'text-amber-400'
      };
    case 'bad':
      return { 
        bg: 'bg-red-600/40 border border-red-500/70', 
        text: 'text-red-300', 
        bar: 'bg-red-500',
        indicator: 'text-red-400'
      };
    default:
      return { 
        bg: 'bg-gray-700/60 border border-gray-600', 
        text: 'text-gray-300', 
        bar: 'bg-gray-500',
        indicator: 'text-gray-400'
      };
  }
};

export default function KPICard({ 
  title,        // Full title (used for tooltip and as fallback)
  shortTitle,   // Optional short title for display
  value, 
  unit, 
  status, 
  target, 
  interpretation, 
  IconComponent 
}) {
  const colors = getStatusColor(status, value, unit);
  const displayValue = value !== null && value !== undefined ? `${value}${unit === '%' ? '%' : ''}` : 'N/A';
  const displayUnitText = unit !== '%' && value !== null && value !== undefined && unit !== 'status' ? ` ${unit}` : '';
  const isPercentageKpi = unit === '%' && typeof value === 'number' && value >= 0 && value <= 100;

  const titleToDisplay = shortTitle || title; // Use shortTitle if provided, else full title

  return (
    <div className={`p-3 sm:p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:shadow-lg ${colors.bg} flex flex-col justify-between min-h-[160px] sm:min-h-[180px]`}>
      <div>
        <div className="flex items-start justify-between mb-1">
          {/* Display shortTitle (or title if shortTitle is not provided), but tooltip always shows full title */}
          <h3 
            className={`text-sm sm:text-base font-semibold text-textClr-primary truncate mr-2 leading-tight`} 
            title={title} // Always show full title on hover
          >
            {titleToDisplay}
          </h3>
          {IconComponent && <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.indicator} flex-shrink-0`} />}
        </div>
        {/* ... rest of the card content (value, progress bar) ... */}
        <div className={`text-2xl sm:text-3xl font-bold ${colors.text} mb-1.5`}>
          {displayValue}
          <span className="text-base sm:text-lg font-normal">{displayUnitText}</span>
        </div>

        {isPercentageKpi && (
          <div className="w-full bg-gray-600/50 rounded-full h-2 my-1.5 overflow-hidden">
            <div
              className={`${colors.bar} h-2 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
            ></div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-1">
        <div className={`text-xs sm:text-sm ${colors.indicator} capitalize`}>
          Status: {status || 'N/A'}
        </div>
        {/* ... target and interpretation ... */}
      </div>
    </div>
  );
}