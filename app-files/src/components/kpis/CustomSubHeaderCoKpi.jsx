// src/components/kpis/CustomSubHeaderCoKpi.jsx
import React from 'react';

export default function CustomSubHeaderCoKpi({ stats }) {
  if (!stats) {
    return null; 
  }

  // These keys (totalRelevantContracts, onTimeCount, notOnTimeCount)
  // must match what your API's coKpiOnTimeService.js provides in customStats
  return (
    <>
      <span className="text-gray-500">|</span>
      <span>Total Contracts (CO KPI): <span className="font-semibold text-textClr-primary">{stats.totalRelevantContracts !== undefined ? stats.totalRelevantContracts : 'N/A'}</span></span>
      
      <span className="text-gray-500">|</span>
      <span>On Time: <span className="font-semibold text-emerald-400">{stats.onTimeCount !== undefined ? stats.onTimeCount : 'N/A'}</span></span>
      
      <span className="text-gray-500">|</span>
      <span>Not On Time: <span className="font-semibold text-red-400">{stats.notOnTimeCount !== undefined ? stats.notOnTimeCount : 'N/A'}</span></span>
      
      {/* You can add a percentage here too if calculated and provided in stats */}
      {/* For example:
      {stats.onTimePercentage !== undefined && (
        <>
          <span className="text-gray-500">|</span>
          <span>% On Time: <span className="font-semibold text-blue-400">{stats.onTimePercentage.toFixed(1)}%</span></span>
        </>
      )}
      */}
    </>
  );
}