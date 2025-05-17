// src/app/kpis/co-kpi/page.jsx
'use client';

import React from 'react';
import KpiDetailPageLayout from '@/components/layouts/KpiDetailPageLayout'; // Import the layout
import CustomSubHeaderCoKpi from '@/components/kpis/CustomSubHeaderCoKpi'; // Import its specific sub-header
import { KPI_NAMES, KPI_SHORT_TITLES } from '@/lib/kpiConstants'; // Import constants

// Define constants specific to THIS KPI page
const THIS_KPI_KEY = KPI_NAMES.CO_KPI_ON_TIME; // Make sure this matches the key in kpiConstants.js
const THIS_KPI_PAGE_TITLE = "CO KPI On Time - Performance Details"; // Customize as needed
const THIS_KPI_SHORT_TITLE_FOR_CARD = KPI_SHORT_TITLES[THIS_KPI_KEY] || "CO On Time"; // Fallback if not in constants

export default function CoKpiDetailPage() {
  return (
    <KpiDetailPageLayout
      kpiPageKey={THIS_KPI_KEY}
      kpiPageTitle={THIS_KPI_PAGE_TITLE}
      CustomSubHeaderComponent={CustomSubHeaderCoKpi}
      kpiShortTitleForCard={THIS_KPI_SHORT_TITLE_FOR_CARD}
      // Optional: If you have a very specific icon component different from what KpiIconMapping[kpiPageKey] provides,
      // you could pass an kpiIconComponent prop here, and KpiDetailPageLayout would need to be adjusted to use it.
      // For now, KpiDetailPageLayout derives it from kpiPageKey.
    />
  );
}