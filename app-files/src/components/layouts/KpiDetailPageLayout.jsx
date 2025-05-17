// src/components/layouts/KpiDetailPageLayout.jsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext'; // Ensure this path is correct
import { useRouter, useSearchParams } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Import shared constants
import { kpiIcons as KpiIconMapping } from '@/lib/kpiConstants.js'; // Ensure this path is correct
import KPICard from '@/components/KPICard';     // Ensure this path is correct
import FilterBar from '@/components/FilterBar'; // Ensure this path is correct
import { FaExclamationTriangle } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Note: KPI_PAGE_KEY and KPI_PAGE_NAME are now passed as props (kpiPageKey, kpiPageTitle)

export default function KpiDetailPageLayout({
  kpiPageKey,             // REQUIRED: e.g., "AWARD_NOTICE_ON_TIME" (used as metricName for API)
  kpiPageTitle,           // REQUIRED: e.g., "Award Notice On Time Details"
  CustomSubHeaderComponent, // REQUIRED: The specific component for custom stats
  kpiShortTitleForCard,   // OPTIONAL: Short title for the KPICard
  // kpiIconComponent,    // OPTIONAL: Specific Icon component (otherwise derived)
}) {
  // Chart options (defined inside so it can use props if needed, though kpiPageTitle is used here)
  const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: '#9CA3AF' } }, 
        title: { display: true, text: `${kpiPageTitle || 'KPI'} Trend`, color: '#E5E7EB' }, // Use kpiPageTitle
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
                  const unit = this.chart.data.datasets[0]?.unit || '%';
                  return value + unit; 
              } 
          }, 
          grid: { color: 'rgba(107, 114, 128, 0.2)' }, 
          min: 0, 
          suggestedMax: 100 
        }
      }
  };

  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const [kpiDetailData, setKpiDetailData] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState('');

  // Filter states
  const [teams, setTeams] = useState([]);
  const [subTeams, setSubTeams] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [snapshotMonths, setSnapshotMonths] = useState([]); 

  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedSubTeam, setSelectedSubTeam] = useState('');
  const [selectedPersonnel, setSelectedPersonnel] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState('');

  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingSubTeams, setIsLoadingSubTeams] = useState(false);
  const [isLoadingPersonnel, setIsLoadingPersonnel] = useState(false);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false); 

  // Set initial filter values from URL query parameters
  useEffect(() => {
    setSelectedTeam(searchParams.get('teamId') || '');
    setSelectedSubTeam(searchParams.get('subTeamId') || '');
    setSelectedPersonnel(searchParams.get('personnelId') || '');
    setSelectedSnapshot(searchParams.get('snapshotMonth') || '');
  }, [searchParams]);

  const updateUrlWithFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString()); 
    if (selectedTeam) params.set('teamId', selectedTeam); else params.delete('teamId');
    if (selectedSubTeam) params.set('subTeamId', selectedSubTeam); else params.delete('subTeamId');
    if (selectedPersonnel) params.set('personnelId', selectedPersonnel); else params.delete('personnelId');
    if (selectedSnapshot) params.set('snapshotMonth', selectedSnapshot); else params.delete('snapshotMonth');
    
    const newSearch = params.toString();
    const currentPath = window.location.pathname; // Use currentPath for dynamic detail pages
    router.replace(`${currentPath}${newSearch ? `?${newSearch}` : ''}`, { scroll: false });
  }, [selectedTeam, selectedSubTeam, selectedPersonnel, selectedSnapshot, router, searchParams]);

  const fetchDetailData = useCallback(async () => {
    if (!user || !kpiPageKey) { // Added check for kpiPageKey
        console.log("KpiDetailLayout: User or kpiPageKey not available, skipping fetchDetailData.", {user, kpiPageKey});
        return;
    }

    setIsLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (selectedTeam) queryParams.append('teamId', selectedTeam);
      if (selectedSubTeam) queryParams.append('subTeamId', selectedSubTeam);
      if (selectedPersonnel) queryParams.append('personnelId', selectedPersonnel);
      if (selectedSnapshot) queryParams.append('snapshotMonth', selectedSnapshot);
      queryParams.append('kpiName', kpiPageKey); // Use kpiPageKey prop

      const queryString = queryParams.toString();
      const response = await fetch(`/api/kpis/detail?${queryString}`); 
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch details for ${kpiPageKey}`);
      }
      const data = await response.json();
      setKpiDetailData(data);
    } catch (err) {
      console.error(`Error fetching ${kpiPageKey} details:`, err);
      setError(err.message);
      setKpiDetailData(null); 
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedTeam, selectedSubTeam, selectedPersonnel, selectedSnapshot, kpiPageKey]); // Use kpiPageKey prop

  // Auth check
  useEffect(() => {
    if (!authIsLoading && !user) {
      router.push('/auth/login'); // Adjust as per your auth flow
    }
  }, [user, authIsLoading, router]);

  // Initial data fetch
  useEffect(() => {
    if (!authIsLoading && user && kpiPageKey) { // Ensure kpiPageKey is also present
      fetchDetailData();
    }
  }, [user, authIsLoading, fetchDetailData, kpiPageKey]); // Added kpiPageKey here

  // Fetch Filter Options (Teams, Snapshots)
  useEffect(() => {
    if (user) { 
      setIsLoadingTeams(true);
      fetch('/api/filters/teams')
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch teams: ${res.status}`)))
        .then(data => setTeams(data || []))
        .catch(err => console.error("Error fetching teams:", err))
        .finally(() => setIsLoadingTeams(false));

      setIsLoadingSnapshots(true);
      fetch('/api/filters/snapshots')
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch snapshots: ${res.status}`)))
        .then(data => setSnapshotMonths(data || []))
        .catch(err => {
            console.error("Error fetching snapshots:", err);
            setSnapshotMonths([]); 
        })
        .finally(() => setIsLoadingSnapshots(false));
    }
  }, [user]);

  // Fetch Sub-Teams
  useEffect(() => {
    if (selectedTeam && user) {
      setIsLoadingSubTeams(true);
      setSubTeams([]); 
      fetch(`/api/filters/subteams?teamId=${selectedTeam}`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch sub-teams: ${res.status}`)))
        .then(data => setSubTeams(data || []))
        .catch(err => console.error("Error fetching sub-teams:", err))
        .finally(() => setIsLoadingSubTeams(false));
    } else {
      setSubTeams([]); 
      if (!selectedTeam) setSelectedSubTeam(''); 
    }
  }, [selectedTeam, user]);

  // Fetch Personnel
  useEffect(() => {
    if (selectedSubTeam && user) {
      setIsLoadingPersonnel(true);
      setPersonnelList([]);
      fetch(`/api/filters/personnel?subTeamId=${selectedSubTeam}`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch personnel: ${res.status}`)))
        .then(data => setPersonnelList(data || []))
        .catch(err => console.error("Error fetching personnel:", err))
        .finally(() => setIsLoadingPersonnel(false));
    } else {
      setPersonnelList([]);
      if (!selectedSubTeam) setSelectedPersonnel(''); 
    }
  }, [selectedSubTeam, user]);
  
  const handleApplyFilters = () => {
    updateUrlWithFilters(); 
    // fetchDetailData will be triggered by useEffect watching its dependencies (including selected filters)
  };

  const handleClearFilters = () => {
    setSelectedTeam('');
    setSelectedSubTeam(''); 
    setSelectedPersonnel('');
    setSelectedSnapshot('');
    // Construct the path without query parameters. 
    // Needs kpiPageKey to reconstruct current path for current kpi.
    // This needs careful handling if the layout is used for various /kpis/[slug] paths.
    // For now, assuming router.replace(window.location.pathname) is okay if base path is constant.
    // Or, more robustly:
    const currentPathWithoutQuery = window.location.pathname;
    router.replace(currentPathWithoutQuery, { scroll: false }); 
  };

  // UNCONDITIONAL LOG RIGHT BEFORE THE MAIN RETURN
  // console.log(
  //   `KpiDetailPageLayout RENDER - snapshotMonths: ${JSON.stringify(snapshotMonths)}, isLoadingSnapshots: ${isLoadingSnapshots}, selectedSnapshot: "${selectedSnapshot}"`
  // );

  if (authIsLoading || (isLoading && !kpiDetailData)) { // Show loading if auth loading OR main data loading AND no data yet
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 min-h-[calc(100vh-4rem)] flex justify-center items-center">
        <p className="text-textClr-primary">Loading {kpiPageTitle || 'KPI'} details...</p>
      </div>
    );
  }

  if (!user && !authIsLoading) { 
      return <p className="text-center text-textClr-primary p-10">Please log in to view KPI details.</p>; 
  }
  
  const PageKpiIcon = KpiIconMapping[kpiPageKey] || KpiIconMapping.default;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      {/* Page Title and Custom Sub-Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-textClr-primary">
          {kpiPageTitle} {/* Use prop */}
        </h1>
        <div className="text-xs sm:text-sm text-textClr-secondary mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Snapshot: <span className="font-semibold text-accent-primary">{kpiDetailData?.currentSnapshotMonth || "N/A"}</span></span>
            <span className="text-gray-500">|</span>
            <span>Scope: <span className="font-semibold text-accent-primary">{kpiDetailData?.dataScope?.name || "N/A"}</span></span>
            
            {/* Render the passed CustomSubHeaderComponent if stats are available */}
            {CustomSubHeaderComponent && kpiDetailData?.customStats && (
              <CustomSubHeaderComponent stats={kpiDetailData.customStats} />
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
        
        snapshotMonths={snapshotMonths}            
        selectedSnapshot={selectedSnapshot}       
        setSelectedSnapshot={setSelectedSnapshot}  
        isLoadingSnapshots={isLoadingSnapshots}    
        
        onApplyFilters={handleApplyFilters} 
        onClearFilters={handleClearFilters}
        isLoadingTeams={isLoadingTeams}        
        isLoadingSubTeams={isLoadingSubTeams}  
        isLoadingPersonnel={isLoadingPersonnel}
      />
      
      {error && (
         <div className="my-6 bg-red-600/30 border border-red-500/70 text-red-300 p-3 md:p-4 rounded-lg">
          <p><FaExclamationTriangle className="inline mr-2 mb-0.5"/>Error loading data for {kpiPageTitle || 'this KPI'}: {error}</p>
        </div>
      )}

      {(!error && !isLoading && !kpiDetailData) && ( // Case where loading is done but no data (and no error)
        <div className="my-6 bg-yellow-600/30 border border-yellow-500/70 text-yellow-300 p-3 md:p-4 rounded-lg">
            <p><FaExclamationTriangle className="inline mr-2 mb-0.5"/>No data available for {kpiPageTitle || 'this KPI'} with the current filters.</p>
        </div>
      )}

      {!error && kpiDetailData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* KPI Card for this specific KPI */}
            <div className="md:col-span-1">
              {kpiDetailData.currentValue ? (
                <KPICard
                  title={kpiShortTitleForCard || kpiDetailData.displayName || kpiPageKey}
                  value={kpiDetailData.currentValue.value}
                  unit={kpiDetailData.currentValue.unit}
                  status={kpiDetailData.currentValue.status}
                  IconComponent={PageKpiIcon}
                />
              ) : !isLoading && ( // Show if not loading and no current value
                <div className="p-4 bg-background-secondary rounded-lg shadow text-center text-textClr-secondary h-full flex items-center justify-center">Current KPI value not available.</div>
              )}
            </div>

            {/* Trend Chart */}
            <div className="md:col-span-2 bg-background-secondary p-4 md:p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-accent-primary mb-4">Trend Over Time</h2>
              <div className="h-64 md:h-80 bg-background-tertiary rounded p-2">
                {kpiDetailData.trendData?.labels?.length > 0 ? (
                  <Line data={kpiDetailData.trendData} options={chartOptions} />
                ) : !isLoading && ( // Show if not loading and no trend data
                  <p className="text-center text-textClr-secondary p-4">Trend data not available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Granular Data Table */}
          <div className="mt-8 bg-background-secondary p-4 md:p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-accent-primary mb-4">Supporting Data ({kpiDetailData.currentSnapshotMonth || 'N/A'})</h2>
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
            ) : !isLoading && ( // Show if not loading and no detail table data
              <p className="text-center text-textClr-secondary p-4">Detailed data not available for this snapshot/scope.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}