// src/lib/kpiDetailServices/coKpiOnTimeService.js
import { KPI_NAMES } from '@/lib/kpiConstants'; // Assuming KPI_NAMES might be used internally

/**
 * Fetches and formats detail data for the "CO KPI On Time" KPI.
 * @param {object} prisma - The Prisma client instance.
 * @param {object} personnelFilter - The Prisma filter object for personnel.
 * @param {string} currentSnapshotMonth - The most recent snapshot month string.
 * @param {string} kpiName - The specific KPI name (should be KPI_NAMES.CO_KPI_ON_TIME).
 * @param {object} responseData - The pre-initialized responseData object to be populated.
 * @returns {Promise<object>} The populated responseData object.
 */
export async function getCoKpiOnTimeDetailData(prisma, personnelFilter, currentSnapshotMonth, kpiName, responseData) {
    // 1. Fetch current value for latest snapshot (already partially done by main route, but we can refine/confirm here)
    const currentMetrics = await prisma.contract.findMany({
        where: { 
            snapshotMonth: currentSnapshotMonth,
            ...personnelFilter, 
            metricName: KPI_NAMES.CO_KPI_ON_TIME 
        },
        select: { value: true }
    });

    let onTimeCount = 0;
    let totalRelevantContracts = currentMetrics.length;

    if (totalRelevantContracts > 0) {
        currentMetrics.forEach(m => {
            if (m.value === "1") {
                onTimeCount++;
            }
        });
        const percentage = (onTimeCount / totalRelevantContracts) * 100;
        responseData.currentValue = {
            name: kpiName,
            value: parseFloat(percentage.toFixed(1)),
            unit: '%',
            status: percentage >= 95 ? 'Good' : percentage >= 80 ? 'Ok' : 'Bad'
        };
    } else {
        responseData.currentValue = { name: kpiName, value: null, unit: '%', status: 'N/A' };
    }

    // Custom stats specific to CO KPI On Time
    responseData.customStats = {
        totalRelevantContracts: totalRelevantContracts,
        onTimeCount: onTimeCount,
        notOnTimeCount: totalRelevantContracts - onTimeCount
    };
    responseData.currentValue.unit = '%'; // Confirm unit for this KPI

    // 2. Fetch Trend Data
    const distinctSnapshotsForKPI = await prisma.contract.groupBy({
        by: ['snapshotMonth'],
        where: { ...personnelFilter, metricName: KPI_NAMES.CO_KPI_ON_TIME },
        orderBy: { snapshotMonth: 'asc' },
    });
    const trendLabels = distinctSnapshotsForKPI.map(s => s.snapshotMonth);
    const trendDataPoints = [];

    for (const snap of distinctSnapshotsForKPI) {
        const snapMetrics = await prisma.contract.findMany({
            where: { snapshotMonth: snap.snapshotMonth, ...personnelFilter, metricName: KPI_NAMES.CO_KPI_ON_TIME },
            select: { value: true }
        });
        if (snapMetrics.length > 0) {
            const s = snapMetrics.filter(m => m.value === "1").length;
            trendDataPoints.push(parseFloat(((s / snapMetrics.length) * 100).toFixed(1)));
        } else {
            trendDataPoints.push(null); 
        }
    }
    // Ensure trendData.datasets[0] exists from template
    responseData.trendData.labels = trendLabels.slice(-12);
    if (responseData.trendData.datasets[0]) {
        responseData.trendData.datasets[0].data = trendDataPoints.slice(-12);
        responseData.trendData.datasets[0].label = kpiName; // Or a more specific label like "% On Time"
        responseData.trendData.datasets[0].unit = '%'; // Add unit if your chart consumes it
    }


    // 3. Fetch Detail Table Data
    responseData.detailTable.headers = ["Contract ID", "Assigned To", "Target Date", "Actual Date", "On Time?"];
    const rawContractDetails = await prisma.contract.findMany({
        where: { 
            snapshotMonth: currentSnapshotMonth, 
            ...personnelFilter, 
            metricName: KPI_NAMES.CO_KPI_ON_TIME // Assuming these fields are on this metric row
        },
        select: { 
            contractId: true, 
            personnelId: true,
            coKpiTargetCompletionDate: true, 
            coKpiActualCompletionDate: true, 
            value: true 
        },
        orderBy: { contractId: 'asc' },
        take: 50 
    });

    const personnelIdsForTable = [...new Set(rawContractDetails.map(c => c.personnelId).filter(Boolean))];
    let personnelMap = {};
    if (personnelIdsForTable.length > 0) {
        const personnelRecords = await prisma.personnel.findMany({
            where: { personnelId: { in: personnelIdsForTable } },
            select: { personnelId: true, personnelName: true }
        });
        personnelMap = Object.fromEntries(personnelRecords.map(p => [p.personnelId, p.personnelName]));
    }

    responseData.detailTable.data = rawContractDetails.map(c => [
        c.contractId, 
        personnelMap[c.personnelId] || c.personnelId || 'N/A',
        c.coKpiTargetCompletionDate ? new Date(c.coKpiTargetCompletionDate).toLocaleDateString() : 'N/A',
        c.coKpiActualCompletionDate ? new Date(c.coKpiActualCompletionDate).toLocaleDateString() : 'N/A',
        c.value === "1" ? "Yes" : (c.value === "0" ? "No" : "Pending")
    ]);

    return responseData;
}