// src/components/FilterBar.jsx
'use client';

import React from 'react';
import { FaTimes } from 'react-icons/fa'; 

export default function FilterBar({
  // Existing props
  teams,
  subTeams,
  personnel,
  selectedTeam,
  setSelectedTeam,
  selectedSubTeam,
  setSelectedSubTeam,
  selectedPersonnel,
  setSelectedPersonnel,
  onApplyFilters,
  onClearFilters,
  isLoadingTeams,
  isLoadingSubTeams,
  isLoadingPersonnel,
  // New props for Snapshot filter
  snapshotMonths,
  selectedSnapshot,
  setSelectedSnapshot,
  isLoadingSnapshots,
}) {
  // This log is good, keep it or refine it
  console.log("FILTERBAR PROPS RECEIVED:", { snapshotMonths, isLoadingSnapshots, selectedSnapshot }); 

  const handleTeamChange = (e) => {
    const value = e.target.value;
    setSelectedTeam(value);
    setSelectedSubTeam(''); 
    setSelectedPersonnel(''); 
  };

  const handleSubTeamChange = (e) => {
    const value = e.target.value;
    setSelectedSubTeam(value);
    setSelectedPersonnel(''); 
  };

  const handlePersonnelChange = (e) => {
    setSelectedPersonnel(e.target.value);
  };

  const handleSnapshotChange = (e) => {
    setSelectedSnapshot(e.target.value);
  };

  const selectClasses = "input-field w-full text-sm appearance-none min-w-0"; 

  return (
    <div className="bg-background-secondary p-3 sm:p-4 rounded shadow-md mb-6 md:mb-8">
      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        {/* Team Dropdown */}
        <div className="flex-grow min-w-[150px] sm:min-w-[180px]"> 
          <select
            id="team-filter"
            title="Select Team"
            value={selectedTeam}
            onChange={handleTeamChange}
            disabled={isLoadingTeams}
            className={selectClasses}
          >
            <option value="">{isLoadingTeams ? "Loading Teams..." : "Filter by Team"}</option>
            {teams.map((team) => (
              <option key={team.teamId} value={team.teamId}>
                {team.teamName}
              </option>
            ))}
          </select>
        </div>

        {/* Sub-Team Dropdown */}
        <div className="flex-grow min-w-[150px] sm:min-w-[180px]">
          <select
            id="subteam-filter"
            title="Select Sub-Team"
            value={selectedSubTeam}
            onChange={handleSubTeamChange}
            disabled={!selectedTeam || isLoadingSubTeams}
            className={selectClasses}
          >
            <option value="">
              {isLoadingSubTeams ? "Loading Sub-Teams..." : 
               !selectedTeam ? "Select a Team first" : "Filter by Sub-Team"}
            </option>
            {subTeams.map((subTeam) => (
              <option key={subTeam.subTeamId} value={subTeam.subTeamId}>
                {subTeam.subTeamName}
              </option>
            ))}
          </select>
        </div>

        {/* Personnel Dropdown */}
        <div className="flex-grow min-w-[150px] sm:min-w-[180px]">
          <select
            id="personnel-filter"
            title="Select Personnel"
            value={selectedPersonnel}
            onChange={handlePersonnelChange}
            disabled={!selectedSubTeam || isLoadingPersonnel}
            className={selectClasses}
          >
            <option value="">
              {isLoadingPersonnel ? "Loading Personnel..." :
               !selectedSubTeam ? "Select a Sub-Team first" : "Filter by Personnel"}
            </option>
            {personnel.map((person) => (
              <option key={person.personnelId} value={person.personnelId}>
                {person.personnelName} ({person.personnelId})
              </option>
            ))}
          </select>
        </div>

        {/* Snapshot Dropdown */}
        <div className="flex-grow min-w-[150px] sm:min-w-[180px]">
          <select
            id="snapshot-filter"
            title="Select Snapshot Month"
            value={selectedSnapshot}
            onChange={handleSnapshotChange} 
            disabled={isLoadingSnapshots}
            className={selectClasses}
          >
            <option value="">{isLoadingSnapshots ? "Loading..." : "Latest Snapshot"}</option>
            
            {/* --- DETAILED LOGGING FOR SNAPSHOT OPTIONS --- */}
            {console.log("FILTERBAR_SNAPSHOT_RENDER_LOGIC: --- Evaluating snapshot options ---")}
            {console.log("FILTERBAR_SNAPSHOT_RENDER_LOGIC: isLoadingSnapshots:", isLoadingSnapshots)}
            {console.log("FILTERBAR_SNAPSHOT_RENDER_LOGIC: snapshotMonths:", snapshotMonths)}
            {console.log("FILTERBAR_SNAPSHOT_RENDER_LOGIC: snapshotMonths exists and has length?", Boolean(snapshotMonths && snapshotMonths.length > 0))}
            
            {(!isLoadingSnapshots && snapshotMonths && snapshotMonths.length > 0) ? (
              snapshotMonths.map((snap, index) => {
                // This log is CRITICAL. If it doesn't appear 12 times when data is loaded, the map isn't running as expected.
                console.log(`FILTERBAR_SNAPSHOT_RENDER_LOGIC: Mapping item ${index + 1}/${snapshotMonths.length}:`, snap); 
                return (
                  <option key={snap.value || `snap-opt-${index}`} value={snap.value}>
                    {snap.label}
                  </option>
                );
              })
            ) : (
              // This block runs if the above condition is false.
              (!isLoadingSnapshots && snapshotMonths) && 
                console.log("FILTERBAR_SNAPSHOT_RENDER_LOGIC: Condition to map was FALSE or snapshotMonths is empty. isLoadingSnapshots:", isLoadingSnapshots, "snapshotMonths length:", snapshotMonths?.length)
            )}
            {console.log("FILTERBAR_SNAPSHOT_RENDER_LOGIC: --- Finished evaluating snapshot options ---")}
            {/* --- END OF DETAILED LOGGING --- */}
          </select>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2 flex-shrink-0">
            <button
                onClick={onApplyFilters}
                title="Apply selected filters"
                className="btn-primary text-sm py-2 px-4 whitespace-nowrap"
            >
                Apply Filters
            </button>
            <button
                onClick={onClearFilters}
                title="Clear all filters"
                className="bg-gray-600 hover:bg-gray-500 text-textClr-primary p-2 rounded-minimal focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
            >
                <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
        </div>
      </div>
    </div>
  );
}