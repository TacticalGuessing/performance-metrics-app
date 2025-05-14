// src/app/dashboard/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Ensure these paths are correct or use your path aliases (e.g., '@/context/AuthContext')
import { useAuth } from '../../context/AuthContext'; 
import KPICard from '../../components/KPICard';     

// Import icons from react-icons
import { 
  FaRegChartBar, FaRegCalendarCheck, FaDollarSign, FaRegThumbsUp, 
  FaBuilding, FaUsers, FaUserCheck, FaTasks, FaBalanceScale, FaExclamationTriangle,
  FaPoundSign // Ensure FaPoundSign is imported
} from 'react-icons/fa';

// KPI Definitions (to map names to icons)
// This should ideally match the names returned by your API
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
  const { user, isLoading: authIsLoading } = useAuth(); // Logout is now in AppHeader
  const router = useRouter();

  const [kpiData, setKpiData] = useState([]);
  const [snapshotMonth, setSnapshotMonth] = useState('');
  const [dataScope, setDataScope] = useState({ level: 'Loading scope...', name: '' }); // Initialize dataScope
  const [kpiFetchLoading, setKpiFetchLoading] = useState(true);
  const [kpiFetchError, setKpiFetchError] = useState('');

  useEffect(() => {
    if (!authIsLoading && !user) {
      router.push('/auth/login');
    }

    if (!authIsLoading && user) {
      const fetchKpiData = async () => {
        setKpiFetchLoading(true);
        setKpiFetchError('');
        try {
          const response = await fetch('/api/kpis/summary');
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch KPI data');
          }
          const data = await response.json();
          setKpiData(data.kpis || []);
          setSnapshotMonth(data.snapshotMonth || '');
          setDataScope(data.dataScope || { level: 'Unknown', name: 'N/A' }); // Store scope
        } catch (err) {
          console.error("KPI Fetch Error:", err);
          setKpiFetchError(err.message);
          setKpiData([]);
          setDataScope({ level: 'Error', name: 'Could not determine data scope' });
        } finally {
          setKpiFetchLoading(false);
        }
      };
      fetchKpiData();
    }
  }, [user, authIsLoading, router]); // router dependency is fine for redirect

  if (authIsLoading || kpiFetchLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center text-textClr-primary">
        <p>Loading dashboard data...</p> 
      </div>
    );
  }

  if (!user) {
    // This should ideally not be reached if useEffect redirect works, but acts as a fallback.
    // Or, you could show a message like "Redirecting to login..."
    return null; 
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      {/* Page Title and Scope Information */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-textClr-primary"> 
          {dataScope.level === "Organization-Wide" ? "Organizational Overview" : 
           dataScope.level ? `${dataScope.level} Overview` : "Dashboard Overview"}
        </h1>
        <div className="text-sm text-textClr-secondary mt-1">
            Viewing data for: <span className="font-semibold text-accent-primary">{dataScope.name || "N/A"}</span>
            {snapshotMonth && <span className="ml-2 sm:ml-4">| Snapshot: <span className="font-semibold text-accent-primary">{snapshotMonth}</span></span>}
        </div>
      </div>
      
      {kpiFetchError && (
        <div className="mb-6 bg-red-600/30 border border-red-500/70 text-red-300 p-3 md:p-4 rounded-lg">
          <p><FaExclamationTriangle className="inline mr-2 mb-0.5"/>Error loading KPIs: {kpiFetchError}</p>
        </div>
      )}

      {kpiData.length > 0 ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {kpiData.map((kpi) => (
            <KPICard
              key={kpi.name}
              title={kpi.name} // Full title for tooltip
              shortTitle={KPI_SHORT_TITLES[kpi.name] || kpi.name} // Short title for display
              value={kpi.value}
              unit={kpi.unit}
              status={kpi.status}
              IconComponent={kpiIcons[kpi.name] || kpiIcons.default}
            />
          ))}
        </div>
      ) : (
        !kpiFetchLoading && !kpiFetchError && (
          <div className="text-center py-10 bg-background-secondary rounded-lg shadow">
            <FaRegChartBar className="mx-auto text-4xl text-gray-500 mb-3" />
            <p className="text-textClr-secondary">No KPI data available for the current scope or snapshot.</p>
            <p className="text-xs text-gray-500 mt-1">This might be because no data has been ingested for this period or scope.</p>
          </div>
        )
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