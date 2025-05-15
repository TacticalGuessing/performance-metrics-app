// src/lib/kpiConstants.js
import { 
  FaRegChartBar, FaRegCalendarCheck, FaDollarSign, FaRegThumbsUp, 
  FaBuilding, FaUsers, FaUserCheck, FaTasks, FaBalanceScale, FaExclamationTriangle,
  FaPoundSign, FaCog // Assuming FaCog might be used elsewhere too, or just import icons as needed
} from 'react-icons/fa';

export const KPI_NAMES = {
    CO_KPI_ON_TIME: "CO KPI On Time",
    AWARD_NOTICE_ON_TIME: "Award Notice On Time",
    UK01_NOTICE_ON_TIME: "UK01 Notice On Time",
    CONTRACT_OVERSPEND_PERCENT: "Contract Overspend %",
    CONTRACT_CLOSURE_ON_TIME: "Closures", // Display name for the card
    EXPIRED_CONTRACT_IS_CLOSED: "Expired Contract Is Closed", // Underlying metric for "Closures" card
    SOCIAL_VALUE_MET: "Social Value Met",
    SME_AWARDED: "SME Awarded",
    COMPETITIVELY_TENDERED: "Competitively Tendered",
    MANDATORY_TRAINING_COMPLETION: "Mandatory Training Completion",
    CABINET_OFFICE_CONDITIONS_MET: "Cabinet Office Conditions Met",
    // Helper metric names for ingestion/API but not directly as displayable KPIs on summary
    CONTRACT_STATUS_TEXT: "Contract Status Text", 
    CONTRACT_BUDGET_VALUE: "Contract Budget Value" 
};

export const kpiIcons = {
  [KPI_NAMES.CO_KPI_ON_TIME]: FaRegCalendarCheck,
  [KPI_NAMES.AWARD_NOTICE_ON_TIME]: FaTasks,
  [KPI_NAMES.UK01_NOTICE_ON_TIME]: FaTasks,
  [KPI_NAMES.CONTRACT_OVERSPEND_PERCENT]: FaPoundSign,
  [KPI_NAMES.CONTRACT_CLOSURE_ON_TIME]: FaRegThumbsUp, // Icon for the "Closures" card
  [KPI_NAMES.EXPIRED_CONTRACT_IS_CLOSED]: FaRegThumbsUp, // Can be the same if it represents the same concept
  [KPI_NAMES.SOCIAL_VALUE_MET]: FaBalanceScale,
  [KPI_NAMES.SME_AWARDED]: FaBuilding,
  [KPI_NAMES.COMPETITIVELY_TENDERED]: FaUsers,
  [KPI_NAMES.MANDATORY_TRAINING_COMPLETION]: FaUserCheck,
  [KPI_NAMES.CABINET_OFFICE_CONDITIONS_MET]: FaRegChartBar,
  default: FaExclamationTriangle 
};

export const KPI_SHORT_TITLES = {
  [KPI_NAMES.CO_KPI_ON_TIME]: "CO KPI",
  [KPI_NAMES.AWARD_NOTICE_ON_TIME]: "Award Notices",
  [KPI_NAMES.UK01_NOTICE_ON_TIME]: "UK01 Notices",
  [KPI_NAMES.CONTRACT_OVERSPEND_PERCENT]: "Overspend %",
  [KPI_NAMES.CONTRACT_CLOSURE_ON_TIME]: "Closures", // Short title for the "Closures" card
  [KPI_NAMES.SOCIAL_VALUE_MET]: "Social Value",
  [KPI_NAMES.SME_AWARDED]: "SME Contracts",
  [KPI_NAMES.COMPETITIVELY_TENDERED]: "Competitive Tenders",
  [KPI_NAMES.MANDATORY_TRAINING_COMPLETION]: "Training Comp.",
  [KPI_NAMES.CABINET_OFFICE_CONDITIONS_MET]: "CO Conditions",
};

// Define kpiLinks here as well, so AppHeader just imports it
export const kpiNavLinks = [
    { name: KPI_NAMES.CO_KPI_ON_TIME, path: '/kpis/co-kpi', icon: kpiIcons[KPI_NAMES.CO_KPI_ON_TIME] },
    { name: KPI_NAMES.AWARD_NOTICE_ON_TIME, path: '/kpis/award-notices', icon: kpiIcons[KPI_NAMES.AWARD_NOTICE_ON_TIME] },
    { name: KPI_NAMES.UK01_NOTICE_ON_TIME, path: '/kpis/uk01-notices', icon: kpiIcons[KPI_NAMES.UK01_NOTICE_ON_TIME] },
    { name: KPI_NAMES.CONTRACT_OVERSPEND_PERCENT, path: '/kpis/overspend', icon: kpiIcons[KPI_NAMES.CONTRACT_OVERSPEND_PERCENT] },
    { name: KPI_NAMES.CONTRACT_CLOSURE_ON_TIME, path: '/kpis/closures', icon: kpiIcons[KPI_NAMES.CONTRACT_CLOSURE_ON_TIME] }, // "Closures" card
    { name: KPI_NAMES.SOCIAL_VALUE_MET, path: '/kpis/social-value', icon: kpiIcons[KPI_NAMES.SOCIAL_VALUE_MET] },
    { name: KPI_NAMES.SME_AWARDED, path: '/kpis/sme-awarded', icon: kpiIcons[KPI_NAMES.SME_AWARDED] },
    { name: KPI_NAMES.COMPETITIVELY_TENDERED, path: '/kpis/competitive-tenders', icon: kpiIcons[KPI_NAMES.COMPETITIVELY_TENDERED] },
    { name: KPI_NAMES.MANDATORY_TRAINING_COMPLETION, path: '/kpis/training-completion', icon: kpiIcons[KPI_NAMES.MANDATORY_TRAINING_COMPLETION] },
    { name: KPI_NAMES.CABINET_OFFICE_CONDITIONS_MET, path: '/kpis/co-conditions', icon: kpiIcons[KPI_NAMES.CABINET_OFFICE_CONDITIONS_MET] },
];