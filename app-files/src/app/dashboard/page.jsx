// src/app/dashboard/page.jsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Ensure these paths are correct or use your path aliases
import { useAuth } from '../../context/AuthContext'; 
import KPICard from '../../components/KPICard';     
import FilterBar from '../../components/FilterBar'; 

// Import icons from react-icons
import { 
  FaRegChartBar, FaRegCalendarCheck, FaRegThumbsUp, 
  FaBuilding, FaUsers, FaUserCheck, FaTasks, FaBalanceScale, FaExclamationTriangle,
  FaPoundSign, FaFileContract, FaCoins 
} from 'react-icons/fa';

// KPI Definitions (to map names to icons and short titles)
// Ensure these names EXACTLY match the 'name' field of the KPI objects returned by your API
const KPI_NAMES = {
    CO_KPI_ON_TIME: "CO KPI On Time",
    AWARD_NOTICE_ON_TIME: "Award Notice On Time",
    UK01_NOTICE_ON_TIME: "UK01 Notice On Time",
    CONTRACT_OVERSPEND_PERCENT: "Contract Overspend %",
    CONTRACT_CLOSURE_ON_TIME: "Contract Closure On Time",
    SOCIAL_VALUE_MET: "Social Value Met",
    SME_AWARDED: "SME Awarded",
    COMPETITIVELY_TENDERED: "Competitively Tendered",
    MANDATORY_TRAINING_COMPLETION: "Mandatory Training Completion",
    CABINET_OFFICE_CONDITIONS_MET: "Cabinet Office Conditions Met",
};

// Map KPI names to icons
const kpiIcons = {
  [KPI_NAMES.CO_KPI_ON_TIME]: FaRegCalendarCheck,
  [KPI_NAMES.AWARD_NOTICE_ON_TIME]: FaTasks,
  [KPI_NAMES.UK01_NOTICE_ON_TIME]: FaTasks,
  [KPI_NAMES.CONTRACT_OVERSPEND_PERCENT]: FaPoundSign,
  [KPI_NAMES.CONTRACT_CLOSURE_ON_TIME]: FaRegThumbsUp,
  [KPI_NAMES.SOCIAL_VALUE_MET]: FaBalanceScale,
  [KPI_NAMES.SME_AWARDED]: FaBuilding,
  [KPI_NAMES.COMPETITIVELY_TENDERED]: FaUsers,
  [KPI_NAMES.MANDATORY_TRAINING_COMPLETION]: FaUserCheck,
  [KPI_NAMES.CABINET_OFFICE_CONDITIONS_MET]: FaRegChartBar,
  default: FaExclamationTriangle 
};

// Define short titles for KPIs
const KPI_SHORT_TITLES = {
  [KPI_NAMES.CO_KPI_ON_TIME]: "CO KPI",
  [KPI_NAMES.AWARD_NOTICE_ON_TIME]: "Award Notices",
  [KPI_NAMES.UK01_NOTICE_ON_TIME]: "UK01 Notices",
  [KPI_NAMES.CONTRACT_OVERSPEND_PERCENT]: "Overspend %",
  [KPI_NAMES.CONTRACT_CLOSURE_ON_TIME]: "Closures",
  [KPI_NAMES.SOCIAL_VALUE_MET]: "Social Value",
  [KPI_NAMES.SME_AWARDED]: "SME Contracts",
  [KPI_NAMES.COMPETITIVELY_TENDERED]: "Competitive Tenders",
  [KPI_NAMES.MANDATORY_TRAINING_COMPLETION]: "Training Comp.",
  [KPI_NAMES.CABINET_OFFICE_CONDITIONS_MET]: "CO Conditions",
};


export default function DashboardPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  const [liveContractStats, setLiveContractStats] = useState({ count: 0, totalValue: 0 });

  // KPI Data State
  const [kpiData, setKpiData] = useState([]);
  const [snapshotMonth, setSnapshotMonth] = useState('');
  const [dataScope, setDataScope] = useState({ level: 'Loading scope...', name: '' });
  const [kpiFetchLoading, setKpiFetchLoading] = useState(true);
  const [kpiFetchError, setKpiFetchError] = useState('');

  // Filter Data State (for dropdown options)
  const [teams, setTeams] = useState([]);
  const [subTeams, setSubTeams] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);

  // Selected Filter Values State
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedSubTeam, setSelectedSubTeam] = useState('');
  const [selectedPersonnel, setSelectedPersonnel] = useState('');

  // Loading states for filter dropdowns
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingSubTeams, setIsLoadingSubTeams] = useState(false);
  const [isLoadingPersonnel, setIsLoadingPersonnel] = useState(false);

  // Callback for fetching main KPI data based on current filters
  const fetchKpiDataWithFilters = useCallback(async () => {
    setKpiFetchLoading(true);
    setKpiFetchError('');
    
    const queryParams = new URLSearchParams();
    if (selectedTeam) queryParams.append('teamId', selectedTeam);
    if (selectedSubTeam) queryParams.append('subTeamId', selectedSubTeam);
    if (selectedPersonnel) queryParams.append('personnelId', selectedPersonnel);

    const queryString = queryParams.toString();
    const apiUrl = `/api/kpis/summary${queryString ? `?${queryString}` : ''}`;
    console.log("Fetching KPIs from:", apiUrl);

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch KPI data');
      }
      const data = await response.json();
      setKpiData(data.kpis || []);
      setSnapshotMonth(data.snapshotMonth || '');
      setDataScope(data.dataScope || { level: 'Unknown', name: 'N/A' });
      setLiveContractStats(data.liveContractStats || { count: 0, totalValue: 0 });
    } catch (err) {
      console.error("KPI Fetch Error:", err);
      setKpiFetchError(err.message);
      setKpiData([]);
      setDataScope({ level: 'Error', name: 'Could not determine data scope' });
      setLiveContractStats({ count: 0, totalValue: 0 });
    } finally {
      setKpiFetchLoading(false);
    }
  }, [selectedTeam, selectedSubTeam, selectedPersonnel]); // Dependencies for re-fetching

  // Initial Auth Check & Default KPI Data Load
  useEffect(() => {
    if (!authIsLoading && !user) {
      router.push('/auth/login');
    }
    // Initial data load when user is confirmed (and filters are empty)
    if (!authIsLoading && user && !selectedTeam && !selectedSubTeam && !selectedPersonnel) {
      fetchKpiDataWithFilters(); 
    }
  }, [user, authIsLoading, router, fetchKpiDataWithFilters, selectedTeam, selectedSubTeam, selectedPersonnel]);

  // Fetch Teams for filter dropdown
  useEffect(() => {
    if (user) { 
      setIsLoadingTeams(true);
      fetch('/api/filters/teams')
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch teams: ${res.status}`)))
        .then(data => {
          setTeams(data || []);
        })
        .catch(err => {
          console.error("Error fetching teams:", err);
          // Optionally set an error state for team filter
        })
        .finally(() => setIsLoadingTeams(false));
    }
  }, [user]);

  // Fetch Sub-Teams when a Team is selected
  useEffect(() => {
    if (selectedTeam && user) {
      setIsLoadingSubTeams(true);
      setSubTeams([]); 
      // setSelectedSubTeam(''); // This is handled in FilterBar's onChange
      // setSelectedPersonnel('');
      fetch(`/api/filters/subteams?teamId=${selectedTeam}`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch sub-teams: ${res.status}`)))
        .then(data => {
          setSubTeams(data || []);
        })
        .catch(err => {
          console.error("Error fetching sub-teams:", err);
        })
        .finally(() => setIsLoadingSubTeams(false));
    } else {
      setSubTeams([]); 
    }
  }, [selectedTeam, user]);

  // Fetch Personnel when a Sub-Team is selected
  useEffect(() => {
    if (selectedSubTeam && user) {
      setIsLoadingPersonnel(true);
      setPersonnelList([]);
      // setSelectedPersonnel(''); // Handled in FilterBar's onChange
      fetch(`/api/filters/personnel?subTeamId=${selectedSubTeam}`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch personnel: ${res.status}`)))
        .then(data => {
          setPersonnelList(data || []);
        })
        .catch(err => {
          console.error("Error fetching personnel:", err);
        })
        .finally(() => setIsLoadingPersonnel(false));
    } else {
      setPersonnelList([]);
    }
  }, [selectedSubTeam, user]);
  
  // Handler for applying filters (called by FilterBar)
  const handleApplyFilters = () => {
    fetchKpiDataWithFilters(); // Uses current selectedTeam, selectedSubTeam, selectedPersonnel
  };

  // Handler for clearing filters (called by FilterBar)
  const handleClearFilters = () => {
    setSelectedTeam('');
    // Setting selectedTeam to '' will trigger the useEffect for subTeams to clear
    // Setting selectedSubTeam to '' will trigger the useEffect for personnelList to clear
    // No need to manually set them here if the FilterBar and useEffects handle cascading resets.
    // However, to be explicit and ensure immediate state update for fetchKpiDataWithFilters:
    setSelectedSubTeam('');
    setSelectedPersonnel('');
    // Then fetch with empty filters (which fetchKpiDataWithFilters will do if these states are empty)
    // To make it more immediate, we can pass empty filters explicitly, though useCallback should pick up new state
    fetchKpiDataWithFilters(); // This will now use the cleared filter states
  };

  if (authIsLoading || (kpiFetchLoading && kpiData.length === 0 && !kpiFetchError)) { 
    return (
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center text-textClr-primary">
        <p>Loading dashboard data...</p> 
      </div>
    );
  }

  if (!user) {
    // This should not be reached if auth check and redirect are working properly
    return null; 
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      {/* Page Title and Scope Information */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-textClr-primary"> 
          {dataScope.level === "Organisation-Wide" && !selectedTeam && !selectedSubTeam && !selectedPersonnel 
            ? "Organisational Overview" 
            : dataScope.level ? `${dataScope.level} Performance` 
            : "Dashboard Overview"}
        </h1>
        <div className="text-xs sm:text-sm text-textClr-secondary mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
                Viewing data for: <span className="font-semibold text-accent-primary">{dataScope.name || "N/A"}</span>
            </span>
            {snapshotMonth && (
                <>
                    <span className="text-gray-500">|</span>
                    <span>Snapshot: <span className="font-semibold text-accent-primary">{snapshotMonth}</span></span>
                </>
            )}
            {/* Display Live Contract Stats inline here */}
            {(liveContractStats.count > 0 || dataScope.level === "Organization-Wide") && ( // Show even if 0 for org-wide
                <>
                    <span className="text-gray-500">|</span>
                    <span className="flex items-center">
                         
                        Live Contracts: <span className="font-semibold text-accent-primary ml-1">{liveContractStats.count}</span>
                    </span>
                    <span className="text-gray-500">|</span>
                    <span className="flex items-center">
                        
                        Total Value: <span className="font-semibold text-accent-primary ml-1">
                            £{liveContractStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </span>
                </>
            )}
        </div>
      </div>

      

      {/* Filter Bar */}
      <FilterBar
        teams={teams}
        subTeams={subTeams}
        personnel={personnelList}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        selectedSubTeam={selectedSubTeam}
        setSelectedSubTeam={setSelectedSubTeam}
        selectedPersonnel={selectedPersonnel}
        setSelectedPersonnel={setSelectedPersonnel}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        isLoadingTeams={isLoadingTeams}
        isLoadingSubTeams={isLoadingSubTeams}
        isLoadingPersonnel={isLoadingPersonnel}
      />
      
      {kpiFetchError && (
        <div className="my-6 bg-red-600/30 border border-red-500/70 text-red-300 p-3 md:p-4 rounded-lg">
          <p><FaExclamationTriangle className="inline mr-2 mb-0.5"/>Error loading KPIs: {kpiFetchError}</p>
        </div>
      )}

      {/* Conditional rendering for KPI cards based on loading and error states */}
      {!kpiFetchLoading && !kpiFetchError && kpiData.length > 0 && (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mt-6">
          {kpiData.map((kpi) => (
            <KPICard
              key={kpi.name}
              title={kpi.name} 
              shortTitle={KPI_SHORT_TITLES[kpi.name] || kpi.name} 
              value={kpi.value}
              unit={kpi.unit}
              status={kpi.status}
              IconComponent={kpiIcons[kpi.name] || kpiIcons.default}
            />
          ))}
        </div>
      )}
      
      {!kpiFetchLoading && !kpiFetchError && kpiData.length === 0 && (
         <div className="text-center py-10 mt-6 bg-background-secondary rounded-lg shadow">
            <FaRegChartBar className="mx-auto text-4xl text-gray-500 mb-3" />
            <p className="text-textClr-secondary">No KPI data available for the current selection or snapshot.</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting filters or check if data has been ingested.</p>
          </div>
      )}


      {/* Placeholder for Trend Line Chart */}
      <div className="mt-10 md:mt-12 bg-background-secondary p-4 md:p-6 rounded-card shadow-lg">
        <h2 className="text-xl md:text-2xl font-semibold text-accent-primary mb-4">KPI Trends Over Time</h2>
        <div className="h-56 md:h-64 flex items-center justify-center text-textClr-secondary bg-background-tertiary rounded">
          [Trend Line Chart will go here]
        </div>
      </div>
    </div>
  );
}