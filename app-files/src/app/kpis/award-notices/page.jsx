// src/app/kpis/award-notices/page.jsx
'use client';

import React from 'react';
import KpiDetailPageLayout from '@/components/layouts/KpiDetailPageLayout'; // Adjust path if your layout is elsewhere
import CustomSubHeaderAwardNotice from '@/components/kpis/CustomSubHeaderAwardNotice'; // Adjust path to your specific sub-header component
import { KPI_NAMES, KPI_SHORT_TITLES } from '@/lib/kpiConstants'; // Adjust path to your constants file

// Define constants specific to THIS KPI page
const THIS_KPI_KEY = KPI_NAMES.AWARD_NOTICE_ON_TIME; // Make sure this matches the key in kpiConstants.js
const THIS_KPI_PAGE_TITLE = "Award Notice On Time - Performance Details"; // You can customize this title
const THIS_KPI_SHORT_TITLE_FOR_CARD = KPI_SHORT_TITLES[THIS_KPI_KEY] || "Award Notice"; // Fallback if not in constants

export default function AwardNoticeOnTimePage() {
  return (
    <KpiDetailPageLayout
      kpiPageKey={THIS_KPI_KEY}
      kpiPageTitle={THIS_KPI_PAGE_TITLE}
      CustomSubHeaderComponent={CustomSubHeaderAwardNotice}
      kpiShortTitleForCard={THIS_KPI_SHORT_TITLE_FOR_CARD}
      // Optional: If you have a very specific icon component different from what KpiIconMapping[kpiPageKey] provides,
      // you could pass an kpiIconComponent prop here, and KpiDetailPageLayout would need to be adjusted to use it.
      // For now, KpiDetailPageLayout derives it from kpiPageKey.
    />
  );
}