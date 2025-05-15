// src/app/api/kpis/detail/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// Ensure path alias or relative path is correct
import { getTokenFromRequest, verifyToken } from '@/lib/authUtils.js';
import { KPI_NAMES } from '@/lib/kpiConstants.js';

const prisma = new PrismaClient();

// Helper function to determine target personnel IDs and data scope name based on filters
// This function should be robust and handle all filter combinations.
async function getScopeDetailsFromFiltersForDetail(filterParams = {}) {
    let targetPersonnelIds = [];
    let dataScope = { level: "Organization-Wide", name: "All Teams & Personnel" }; // Default

    // Helper to fetch personnel names if only IDs are available
    const getPersonnelName = async (pId) => {
        if (!pId) return "N/A";
        const pRecord = await prisma.personnel.findUnique({ where: { personnelId: pId }, select: { personnelName: true } });
        return pRecord ? pRecord.personnelName : `Personnel ID: ${pId}`;
    };

    if (filterParams.personnelId) {
        targetPersonnelIds = [filterParams.personnelId];
        dataScope = { level: "Individual", name: await getPersonnelName(filterParams.personnelId) };
    } else if (filterParams.subTeamId) {
        const members = await prisma.personnel.findMany({
            where: { subTeamId: filterParams.subTeamId },
            select: { personnelId: true }
        });
        targetPersonnelIds = members.map(p => p.personnelId);
        const st = await prisma.subTeam.findUnique({
            where: { subTeamId: filterParams.subTeamId },
            include: { team: { select: { teamName: true } } }
        });
        dataScope = { level: "Sub-Team", name: st ? `${st.team.teamName} - ${st.subTeamName}` : `Sub-Team ID: ${filterParams.subTeamId}` };
    } else if (filterParams.teamId) {
        const subTeamsOfTeam = await prisma.subTeam.findMany({
            where: { teamId: filterParams.teamId },
            select: { subTeamId: true }
        });
        const subTeamIds = subTeamsOfTeam.map(st => st.subTeamId);
        if (subTeamIds.length > 0) {
            const members = await prisma.personnel.findMany({
                where: { subTeamId: { in: subTeamIds } },
                select: { personnelId: true }
            });
            targetPersonnelIds = members.map(p => p.personnelId);
        } else {
            targetPersonnelIds = [];
        }
        const t = await prisma.team.findUnique({ where: { teamId: filterParams.teamId } });
        dataScope = { level: "Team", name: t ? t.teamName : `Team ID: ${filterParams.teamId}` };
    } else {
        // No filters applied, so Organization-Wide scope
        const allPersonnel = await prisma.personnel.findMany({ select: { personnelId: true } });
        targetPersonnelIds = allPersonnel.map(p => p.personnelId);
        // dataScope remains as initialized: { level: "Organization-Wide", name: "All Teams & Personnel" }
    }
    
    return { targetPersonnelIds, dataScope };
}


export async function GET(request) {
  console.log("--- /api/kpis/detail GET request received ---");
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    const decodedToken = await verifyToken(token);
    if (!decodedToken || !decodedToken.userId) return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const kpiName = searchParams.get('kpiName');
    const filterParams = {
        teamId: searchParams.get('teamId') || undefined,
        subTeamId: searchParams.get('subTeamId') || undefined,
        personnelId: searchParams.get('personnelId') || undefined,
    };
    Object.keys(filterParams).forEach(key => filterParams[key] === undefined && delete filterParams[key]);

    if (!kpiName) {
      return NextResponse.json({ message: 'kpiName query parameter is required.' }, { status: 400 });
    }
    if (!Object.values(KPI_NAMES).includes(kpiName)) {
        console.error("API Detail Route: Validation FAILED for kpiName:", `"${kpiName}"`);
        return NextResponse.json({ message: `Invalid kpiName provided: ${kpiName}` }, { status: 400 });
    }
    
    console.log(`API Detail: User ID: ${decodedToken.userId}, Role: ${decodedToken.role}, Requested KPI: ${kpiName}, Filters:`, filterParams);

    const { targetPersonnelIds, dataScope } = await getScopeDetailsFromFiltersForDetail(filterParams);
    const personnelFilter = targetPersonnelIds.length > 0 ? { personnelId: { in: targetPersonnelIds } } : {};
    
    // Determine latest snapshot for current value context
    const latestSnapshotRecord = await prisma.contract.findFirst({
        orderBy: { snapshotMonth: 'desc' }, select: { snapshotMonth: true }
    });
    const currentSnapshotMonth = latestSnapshotRecord?.snapshotMonth || "N/A";

    // --- Initialize response structure ---
    let responseData = {
        displayName: kpiName,
        currentSnapshotMonth: currentSnapshotMonth,
        dataScope: dataScope,
        currentValue: { name: kpiName, value: null, unit: '%', status: 'N/A' }, // Default unit to %
        trendData: { labels: [], datasets: [{ label: kpiName, data: [], borderColor: '#10B981', tension: 0.1, fill: true, backgroundColor: 'rgba(16, 185, 129, 0.1)' }] },
        detailTable: { headers: [], data: [] }
    };

    // Fetch metrics for the current snapshot and scope for CO KPI
    const currentSnapshotMetrics = await prisma.contract.findMany({
        where: { 
            snapshotMonth: responseData.currentSnapshotMonth, 
            ...personnelFilter, 
            metricName: KPI_NAMES.CO_KPI_ON_TIME 
        },
        select: { value: true } // value is "0" or "1" (string)
    });

    let onTimeCount = 0;
    let notOnTimeCount = 0; // Includes late and pending/no data if applicable
    let totalRelevantContracts = currentSnapshotMetrics.length;

    if (currentSnapshotMetrics.length > 0) {
        currentSnapshotMetrics.forEach(m => {
            if (m.value === "1") {
                onTimeCount++;
            } else if (m.value === "0") { // Explicitly "0" means late or failed
                notOnTimeCount++;
            }
            // If m.value is null or some other string, it's not counted in either for this simple logic
            // but it is part of totalRelevantContracts.
        });
        const percentage = (onTimeCount / totalRelevantContracts) * 100;
        responseData.currentValue.value = parseFloat(percentage.toFixed(1));
        responseData.currentValue.status = percentage >= 95 ? 'Good' : percentage >= 80 ? 'Ok' : 'Bad';
    } else {
        responseData.currentValue = { name: kpiName, value: null, unit: '%', status: 'N/A' };
    }

    // Add custom stats for the sub-header
    responseData.customStats = {
        totalRelevantContracts: totalRelevantContracts,
        onTimeCount: onTimeCount,
        notOnTimeCount: totalRelevantContracts - onTimeCount // This captures "0" and potentially nulls if any
    };

    // --- Logic to fetch data based on kpiName ---
    if (kpiName === KPI_NAMES.CO_KPI_ON_TIME) {
        responseData.currentValue.unit = '%'; // Confirm unit
        // 1. Fetch current value for latest snapshot
    const currentMetrics = await prisma.contract.findMany({
        where: { 
            snapshotMonth: responseData.currentSnapshotMonth, // Use snapshot determined by API
            ...personnelFilter, 
            metricName: KPI_NAMES.CO_KPI_ON_TIME 
        },
        select: { value: true }
    });
    if (currentMetrics.length > 0) {
        const successful = currentMetrics.filter(m => m.value === "1").length;
        const percentage = (successful / currentMetrics.length) * 100;
        responseData.currentValue.value = parseFloat(percentage.toFixed(1));
        responseData.currentValue.unit = '%'; // Ensure unit is set
        responseData.currentValue.status = percentage >= 95 ? 'Good' : percentage >= 80 ? 'Ok' : 'Bad';
    } else {
        responseData.currentValue = { name: kpiName, value: null, unit: '%', status: 'N/A' };
    }

        // 2. Fetch Trend Data (last 12 months)
        // Get distinct snapshot months where this KPI data exists for the scope
        const distinctSnapshotsForKPI = await prisma.contract.groupBy({
            by: ['snapshotMonth'],
            where: { ...personnelFilter, metricName: KPI_NAMES.CO_KPI_ON_TIME },
            orderBy: { snapshotMonth: 'asc' },
            // take: 12 // Consider if you always want last 12, or all available
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
        responseData.trendData.labels = trendLabels.slice(-12); // Show last 12 available data points
        responseData.trendData.datasets[0].data = trendDataPoints.slice(-12);
        
        // 3. Fetch Detail Table Data (example: contracts related to this KPI for the current snapshot)
        responseData.detailTable.headers = ["Contract ID", "Assigned To", "Target Date", "Actual Date", "On Time?"];
        const rawContractDetails = await prisma.contract.findMany({
            where: { 
                snapshotMonth: currentSnapshotMonth, 
                ...personnelFilter, 
                // We need rows that have the date fields, not just the metric row
                // This assumes the metric rows also store denormalized date fields
                // If not, you need to query distinct contract IDs and then fetch their details.
                // For now, assuming metricName: KPI_NAMES.CO_KPI_ON_TIME has these:
                metricName: KPI_NAMES.CO_KPI_ON_TIME 
            },
            select: { 
                contractId: true, 
                personnelId: true,
                coKpiTargetCompletionDate: true, 
                coKpiActualCompletionDate: true, 
                value: true // This is the "0" or "1" for on-time status for this metricName
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

    } 
    // --- Add similar 'else if' blocks for other KPIs below ---
    // else if (kpiName === KPI_NAMES.CONTRACT_OVERSPEND_PERCENT) { /* ... logic for overspend ... */ }
    // else if (kpiName === KPI_NAMES.MANDATORY_TRAINING_COMPLETION) { /* ... logic for training ... */ }
    
    else {
        // Fallback or mock data for KPIs not yet implemented
        console.warn(`Detail logic for KPI '${kpiName}' is not fully implemented. Returning mock data.`);
        responseData.currentValue = { name: kpiName, value: Math.floor(Math.random() * 100), unit: '%', status: "Ok" };
        responseData.trendData.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        responseData.trendData.datasets[0].data = [65, 59, 80, 81, 56, 55];
        responseData.detailTable.headers = ["ID", "Mock Detail Info"];
        responseData.detailTable.data = [["Mock001", "Some detailed information for this KPI."], ["Mock002", "Another piece of detail."]];
    }

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error(`Error in /api/kpis/detail (kpiName: ${searchParams.get('kpiName')}):`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: 'Failed to fetch KPI details.', error: errorMessage }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}