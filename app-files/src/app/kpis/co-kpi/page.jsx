// src/app/kpis/co-kpi/page.jsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Import shared constants
import { KPI_NAMES, kpiIcons as KpiIconMapping } from '@/lib/kpiConstants.js'; 
import KPICard from '@/components/KPICard';     
import FilterBar from '@/components/FilterBar'; 
import { FaExclamationTriangle } from 'react-icons/fa';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Use the imported constant
const KPI_PAGE_KEY = "CO_KPI_ON_TIME"; 
const KPI_PAGE_NAME = KPI_NAMES[KPI_PAGE_KEY]; // This now uses the imported KPI_NAMES

// Chart options (can be customized further)
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#9CA3AF' } }, // text-gray-400
      title: { display: false, text: `${KPI_PAGE_NAME} Trend` },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.7)', titleFont: { size: 14 }, bodyFont: { size: 12 },
        callbacks: { 
            label: function(context) { 
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += context.formattedValue + (context.dataset.unit || '%');
                }
                return label; 
            } 
        }
      }
    },
    scales: {
      x: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(107, 114, 128, 0.2)' } },
      y: { 
        ticks: { 
            color: '#9CA3AF', 
            callback: function(value) { 
                // Check if dataset has a unit, otherwise default to '%'
                const unit = this.chart.data.datasets[0]?.unit || '%';
                return value + unit; 
            } 
        }, 
        grid: { color: 'rgba(107, 114, 128, 0.2)' }, 
        min: 0, 
        // max: 100, // Only set max if all data is percentage 0-100
        suggestedMax: 100 // Good for percentage KPIs
      }
    }
};


export default function CoKpiDetailPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to read URL query parameters

  const [kpiDetailData, setKpiDetailData] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states - initialize from URL search params if they exist
  const [teams, setTeams] = useState([]);
  const [subTeams, setSubTeams] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  
  // Initialize filter state from URL query parameters on mount
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedSubTeam, setSelectedSubTeam] = useState('');
  const [selectedPersonnel, setSelectedPersonnel] = useState('');

  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingSubTeams, setIsLoadingSubTeams] = useState(false);
  const [isLoadingPersonnel, setIsLoadingPersonnel] = useState(false);
  
  // Set initial filter values from URL query parameters
  useEffect(() => {
    setSelectedTeam(searchParams.get('teamId') || '');
    setSelectedSubTeam(searchParams.get('subTeamId') || '');
    setSelectedPersonnel(searchParams.get('personnelId') || '');
  }, [searchParams]);


  // Function to update URL query params when filters change (without causing re-fetch directly)
  const updateUrlWithFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString()); // Preserve existing params
    if (selectedTeam) params.set('teamId', selectedTeam); else params.delete('teamId');
    if (selectedSubTeam) params.set('subTeamId', selectedSubTeam); else params.delete('subTeamId');
    if (selectedPersonnel) params.set('personnelId', selectedPersonnel); else params.delete('personnelId');
    
    const newSearch = params.toString();
    // Using window.location.pathname as router.pathname might not be updated yet if route changed
    const currentPath = window.location.pathname;
    router.replace(`${currentPath}${newSearch ? `?${newSearch}` : ''}`, { scroll: false });
  }, [selectedTeam, selectedSubTeam, selectedPersonnel, router, searchParams]);

  const fetchDetailData = useCallback(async () => {
    if (!user) return; // Don't fetch if user is not available yet

    setIsLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      // Use current state for selected filters when fetching
      if (selectedTeam) queryParams.append('teamId', selectedTeam);
      if (selectedSubTeam) queryParams.append('subTeamId', selectedSubTeam);
      if (selectedPersonnel) queryParams.append('personnelId', selectedPersonnel);
      queryParams.append('kpiName', KPI_PAGE_NAME);

      const queryString = queryParams.toString();
      const response = await fetch(`/api/kpis/detail?${queryString}`); 
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch details for ${KPI_PAGE_NAME}`);
      }
      const data = await response.json();
      setKpiDetailData(data);
    } catch (err) {
      console.error(`Error fetching ${KPI_PAGE_NAME} details:`, err);
      setError(err.message);
      setKpiDetailData(null); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedTeam, selectedSubTeam, selectedPersonnel]); // Dependencies for re-fetch

  // Auth check
  useEffect(() => {
    if (!authIsLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authIsLoading, router]);

  // Initial data fetch when user is available or filters change (via handleApplyFilters)
  useEffect(() => {
    if (!authIsLoading && user) {
      fetchDetailData();
    }
  }, [user, authIsLoading, fetchDetailData]); // fetchDetailData is now stable due to useCallback


  // Fetch Teams for filter
  useEffect(() => {
    if (user) { 
      setIsLoadingTeams(true);
      fetch('/api/filters/teams')
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch teams: ${res.status}`)))
        .then(data => setTeams(data || []))
        .catch(err => console.error("Error fetching teams:", err))
        .finally(() => setIsLoadingTeams(false));
    }
  }, [user]);

  // Fetch Sub-Teams when a Team is selected
  useEffect(() => {
    if (selectedTeam && user) {
      setIsLoadingSubTeams(true);
      setSubTeams([]); 
      //setSelectedSubTeam(''); // Let FilterBar handle this or handle explicitly
      fetch(`/api/filters/subteams?teamId=${selectedTeam}`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch sub-teams: ${res.status}`)))
        .then(data => setSubTeams(data || []))
        .catch(err => console.error("Error fetching sub-teams:", err))
        .finally(() => setIsLoadingSubTeams(false));
    } else {
      setSubTeams([]); 
      if (!selectedTeam) setSelectedSubTeam(''); // Also reset selectedSubTeam if parent (team) is cleared
    }
  }, [selectedTeam, user]);

  // Fetch Personnel when a Sub-Team is selected
  useEffect(() => {
    if (selectedSubTeam && user) {
      setIsLoadingPersonnel(true);
      setPersonnelList([]);
      //setSelectedPersonnel(''); // Let FilterBar handle this or handle explicitly
      fetch(`/api/filters/personnel?subTeamId=${selectedSubTeam}`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch personnel: ${res.status}`)))
        .then(data => setPersonnelList(data || []))
        .catch(err => console.error("Error fetching personnel:", err))
        .finally(() => setIsLoadingPersonnel(false));
    } else {
      setPersonnelList([]);
      if (!selectedSubTeam) setSelectedPersonnel(''); // Also reset selectedPersonnel if parent (sub-team) is cleared
    }
  }, [selectedSubTeam, user]);
  
  const handleApplyFilters = () => {
    updateUrlWithFilters(); // Update URL first
    fetchDetailData();    // Then fetch data with current state filters
  };

  const handleClearFilters = () => {
    setSelectedTeam('');
    setSelectedSubTeam(''); // This will trigger useEffect for personnel to clear
    setSelectedPersonnel('');
    router.replace(window.location.pathname); // Clear query params from URL
    // fetchDetailData will be called by its own useEffect because selected filters changed to empty
    // Or call it explicitly:
    // fetchDetailData(); // This would fetch with the now-cleared filter states
  };


  if (authIsLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 min-h-[calc(100vh-4rem)] flex justify-center items-center">
        <p className="text-textClr-primary">Loading {KPI_PAGE_NAME} details...</p>
      </div>
    );
  }

  if (!user) return null; 

  // The main icon for THIS KPI page card
  const PageKpiIcon = KpiIconMapping[KPI_PAGE_KEY] || KpiIconMapping.default;

  // Placeholder for custom sub-header stats (e.g., On time vs Late for CO KPI)
  // This data needs to come from kpiDetailData (e.g., kpiDetailData.customStats)
  // Example: const customSubHeaderStats = kpiDetailData?.customStats || { onTime: 'N/A', late: 'N/A', total: 'N/A' }; 
  const customSubHeaderStats = kpiDetailData?.customStats;


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      {/* Page Title and Custom Sub-Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-textClr-primary">
          {/* This uses kpiDetailData.displayName which the API sets to kpiName */}
          {kpiDetailData?.displayName || KPI_PAGE_NAME} 
        </h1>
        <div className="text-xs sm:text-sm text-textClr-secondary mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Snapshot: <span className="font-semibold text-accent-primary">{kpiDetailData?.currentSnapshotMonth || "N/A"}</span></span>
            <span className="text-gray-500">|</span>
            <span>Scope: <span className="font-semibold text-accent-primary">{kpiDetailData?.dataScope?.name || "N/A"}</span></span>
            
            {/* Custom stats for CO KPI On Time */}
            {KPI_PAGE_NAME === KPI_NAMES.CO_KPI_ON_TIME && kpiDetailData?.customStats && (
                <>
                    <span className="text-gray-500">|</span>
                    <span>Total Contracts (CO KPI): <span className="font-semibold text-textClr-primary">{kpiDetailData.customStats.totalRelevantContracts !== undefined ? kpiDetailData.customStats.totalRelevantContracts : 'N/A'}</span></span>
                    <span className="text-gray-500">|</span>
                    <span>On Time: <span className="font-semibold text-emerald-400">{kpiDetailData.customStats.onTimeCount !== undefined ? kpiDetailData.customStats.onTimeCount : 'N/A'}</span></span>
                    <span className="text-gray-500">|</span>
                    <span>Not On Time: <span className="font-semibold text-red-400">{kpiDetailData.customStats.notOnTimeCount !== undefined ? kpiDetailData.customStats.notOnTimeCount : 'N/A'}</span></span>
                </>
            )}
            {/* Add similar conditional blocks for other KPI pages if they have different customStats */}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        teams={teams} subTeams={subTeams} personnel={personnelList}
        selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam}
        selectedSubTeam={selectedSubTeam} setSelectedSubTeam={setSelectedSubTeam}
        selectedPersonnel={selectedPersonnel} setSelectedPersonnel={setSelectedPersonnel}
        onApplyFilters={handleApplyFilters} onClearFilters={handleClearFilters}
        isLoadingTeams={isLoadingTeams} isLoadingSubTeams={isLoadingSubTeams} isLoadingPersonnel={isLoadingPersonnel}
      />
      
      {error && (
         <div className="my-6 bg-red-600/30 border border-red-500/70 text-red-300 p-3 md:p-4 rounded-lg">
          <p><FaExclamationTriangle className="inline mr-2 mb-0.5"/>Error loading data for {KPI_PAGE_NAME}: {error}</p>
        </div>
      )}

      {!error && kpiDetailData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* KPI Card for this specific KPI */}
            <div className="md:col-span-1">
              {kpiDetailData.currentValue ? (
                <KPICard
                  title={kpiDetailData.displayName || KPI_PAGE_NAME}
                  value={kpiDetailData.currentValue.value}
                  unit={kpiDetailData.currentValue.unit}
                  status={kpiDetailData.currentValue.status}
                  IconComponent={PageKpiIcon}
                />
              ) : !isLoading ? (
                <div className="p-4 bg-background-secondary rounded-lg shadow text-center text-textClr-secondary h-full flex items-center justify-center">Current KPI data not available.</div>
              ) : null}
            </div>

            {/* Trend Chart - takes up more space */}
            <div className="md:col-span-2 bg-background-secondary p-4 md:p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-accent-primary mb-4">Trend Over Time</h2>
              <div className="h-64 md:h-80 bg-background-tertiary rounded p-2">
                {kpiDetailData.trendData?.labels?.length > 0 ? (
                  <Line data={kpiDetailData.trendData} options={chartOptions} />
                ) : !isLoading ? (
                  <p className="text-center text-textClr-secondary p-4">Trend data not available.</p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Granular Data Table */}
          <div className="mt-8 bg-background-secondary p-4 md:p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-accent-primary mb-4">Supporting Data ({kpiDetailData.currentSnapshotMonth})</h2>
            {kpiDetailData.detailTable && kpiDetailData.detailTable.data?.length > 0 ? (
              <div className="overflow-x-auto text-textClr-secondary">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700/50">
                    <tr>
                      {kpiDetailData.detailTable.headers.map(header => (
                        <th key={header} scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-textClr-secondary uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-background-secondary divide-y divide-gray-700">
                    {kpiDetailData.detailTable.data.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-background-tertiary/50">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2.5 whitespace-nowrap text-xs text-textClr-primary">
                            {cell !== null && cell !== undefined ? String(cell) : 'N/A'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !isLoading ? (
              <p className="text-center text-textClr-secondary p-4">Detailed data not available for this snapshot/scope.</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}