// src/components/kpis/CustomSubHeaderAwardNotice.jsx
import React from 'react';

export default function CustomSubHeaderAwardNotice({ stats }) {
  if (!stats) {
    return null; 
  }

  return (
    <>
      <span className="text-gray-500">|</span>
      <span>Total Notices: <span className="font-semibold text-textClr-primary">{stats.totalNotices !== undefined ? stats.totalNotices : 'N/A'}</span></span>
      <span className="text-gray-500">|</span>
      <span>On Time: <span className="font-semibold text-emerald-400">{stats.onTime !== undefined ? stats.onTime : 'N/A'}</span></span>
      <span className="text-gray-500">|</span>
      <span>Late/Pending: <span className="font-semibold text-red-400">{stats.late !== undefined ? stats.late : 'N/A'}</span></span>
      {stats.onTimePercentage !== undefined && (
        <>
          <span className="text-gray-500">|</span>
          <span>% On Time: <span className="font-semibold text-blue-400">{stats.onTimePercentage.toFixed(1)}%</span></span>
        </>
      )}
    </>
  );
}