// src/components/FilterBar.jsx
'use client';

import React from 'react';
import { FaTimes } from 'react-icons/fa'; // Import X icon for clear button

export default function FilterBar({
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
}) {
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

  // Common class for select elements to ensure consistency and prevent text truncation
  // 'truncate' class will add ellipsis if text overflows. Remove if you prefer wrapping.
  // 'min-w-0' helps with flex/grid item sizing to allow truncation.
  const selectClasses = "input-field w-full text-sm appearance-none min-w-0"; 
  // The 'appearance-none' removes default browser styling for select, 
  // allowing custom arrow via background image in globals.css or by adding an icon if needed.

  return (
    <div className="bg-background-secondary p-3 sm:p-4 rounded shadow-md mb-6 md:mb-8">
      {/* 
        Adjust grid columns for different screen sizes.
        We want 3 dropdowns and 2 buttons.
        On smallest screens, maybe 1 or 2 items per row.
        On medium screens, maybe 3 dropdowns then buttons below.
        On larger screens, all 5 items in one row.
        Let's try for a layout that flexes and wraps.
      */}
      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        {/* Team Dropdown */}
        <div className="flex-grow min-w-[150px] sm:min-w-[180px]"> 
          {/* Label removed, placeholder text in <option> */}
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
            onChange={handlePersonnelChange} // Use the new handler
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
        
        {/* Action Buttons - using flex to keep them together */}
        <div className="flex space-x-2 flex-shrink-0"> {/* flex-shrink-0 prevents buttons from shrinking too much */}
            <button
                onClick={onApplyFilters}
                title="Apply selected filters"
                className="btn-primary text-sm py-2 px-4 whitespace-nowrap" // Added whitespace-nowrap
            >
                Apply Filters
            </button>
            <button
                onClick={onClearFilters}
                title="Clear all filters"
                className="bg-gray-600 hover:bg-gray-500 text-textClr-primary p-2 rounded-minimal focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
            >
                <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" /> {/* X Icon */}
            </button>
        </div>
      </div>
    </div>
  );
}