// src/lib/kpiDetailServices/awardNoticeOnTimeService.js
import { KPI_NAMES } from '@/lib/kpiConstants';

/**
 * Fetches and formats detail data for the "Award Notice On Time" KPI.
 * @param {object} prisma - The Prisma client instance.
 * @param {object} personnelFilter - The Prisma filter object for personnel.
 * @param {string} currentSnapshotMonth - The most recent snapshot month string.
 * @param {string} kpiName - The specific KPI name (should be KPI_NAMES.AWARD_NOTICE_ON_TIME).
 * @param {object} responseData - The pre-initialized responseData object to be populated.
 * @returns {Promise<object>} The populated responseData object.
 */
export async function getAwardNoticeOnTimeDetailData(prisma, personnelFilter, currentSnapshotMonth, kpiName, responseData) {
    const kpiMetricName = KPI_NAMES.AWARD_NOTICE_ON_TIME; // For clarity within this service

    // 1. Fetch data for currentValue and customStats for the current snapshot
    const currentMetrics = await prisma.contract.findMany({
        where: {
            snapshotMonth: currentSnapshotMonth,
            ...personnelFilter,
            metricName: kpiMetricName,
        },
        select: { value: true }, // value is "0" (Not On Time) or "1" (On Time)
    });

    let onTime = 0;
    let notOnTime = 0; // Late or Pending
    const totalNotices = currentMetrics.length;

    currentMetrics.forEach(metric => {
        if (metric.value === "1") {
            onTime++;
        } else if (metric.value === "0") {
            notOnTime++;
        }
    });

    const onTimePercentage = totalNotices > 0 ? (onTime / totalNotices) * 100 : 0;

    responseData.currentValue = {
        name: kpiName,
        value: parseFloat(onTimePercentage.toFixed(1)),
        unit: '%',
        status: onTimePercentage >= 90 ? "Good" : onTimePercentage >= 70 ? "Ok" : "Bad", // Example thresholds
    };

    responseData.customStats = {
        totalNotices: totalNotices,
        onTime: onTime,
        late: notOnTime, // Using 'late' as the key for "notOnTime"
        onTimePercentage: parseFloat(onTimePercentage.toFixed(1)),
    };

    // 2. Fetch Trend Data (e.g., last 12 available snapshots)
    const distinctSnapshotsForKPI = await prisma.contract.groupBy({
        by: ['snapshotMonth'],
        where: { ...personnelFilter, metricName: kpiMetricName },
        orderBy: { snapshotMonth: 'asc' },
    });

    const trendLabels = distinctSnapshotsForKPI.map(s => s.snapshotMonth);
    const trendDataPoints = [];

    for (const snap of distinctSnapshotsForKPI) {
        const snapMetrics = await prisma.contract.findMany({
            where: { 
                snapshotMonth: snap.snapshotMonth, 
                ...personnelFilter, 
                metricName: kpiMetricName 
            },
            select: { value: true }
        });

        if (snapMetrics.length > 0) {
            const onTimeInSnap = snapMetrics.filter(m => m.value === "1").length;
            trendDataPoints.push(parseFloat(((onTimeInSnap / snapMetrics.length) * 100).toFixed(1)));
        } else {
            trendDataPoints.push(null); // Or 0, depending on how you want to represent no data
        }
    }
    responseData.trendData.labels = trendLabels.slice(-12); // Show last 12 available
    if (responseData.trendData.datasets[0]) {
        responseData.trendData.datasets[0].data = trendDataPoints.slice(-12);
        responseData.trendData.datasets[0].label = "% On Time"; // More specific label
        responseData.trendData.datasets[0].unit = '%';
        // You might want to change borderColor/backgroundColor for different KPIs
        responseData.trendData.datasets[0].borderColor = '#3B82F6'; // Example: blue
        responseData.trendData.datasets[0].backgroundColor = 'rgba(59, 130, 246, 0.1)';
    }


    // 3. Fetch Detail Table Data
    responseData.detailTable.headers = ["Contract ID", "Personnel", "Required By", "Published On", "Status"];
    const rawDetails = await prisma.contract.findMany({
        where: {
            snapshotMonth: currentSnapshotMonth,
            ...personnelFilter,
            metricName: kpiMetricName, // Assuming these fields are denormalized on the metric row
        },
        select: {
            contractId: true,
            personnelId: true, 
            awardNoticeRequiredByDate: true, // <<< CORRECTED to camelCase
            awardNoticePublishedDate: true,  // <<< CORRECTED to camelCase
            value: true,
        },
        orderBy: { contractId: 'asc' }, // Or by award_notice_required_by_date
        take: 50,
    });

    const personnelIdsForTable = [...new Set(rawDetails.map(c => c.personnelId).filter(Boolean))];
    let personnelMap = {};
    if (personnelIdsForTable.length > 0) {
        const personnelRecords = await prisma.personnel.findMany({
            where: { personnelId: { in: personnelIdsForTable } },
            select: { personnelId: true, personnelName: true }
        });
        personnelMap = Object.fromEntries(personnelRecords.map(p => [p.personnelId, p.personnelName]));
    }

    responseData.detailTable.data = rawDetails.map(row => [
        row.contractId,
        personnelMap[row.personnelId] || row.personnelId || 'N/A',
        row.awardNoticeRequiredByDate ? new Date(row.awardNoticeRequiredByDate).toLocaleDateString() : 'N/A',
        row.awardNoticePublishedDate ? new Date(row.awardNoticePublishedDate).toLocaleDateString() : 'N/A',
        row.value === "1" ? "On Time" : (row.value === "0" ? "Late/Pending" : "N/A"),
    ]);

    return responseData;
}