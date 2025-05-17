// src/app/api/kpis/detail/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTokenFromRequest, verifyToken } from '@/lib/authUtils.js';
import { KPI_NAMES } from '@/lib/kpiConstants.js';

// Import KPI Detail Services
import { getCoKpiOnTimeDetailData } from '@/lib/kpiDetailServices/coKpiOnTimeService.js';
import { getAwardNoticeOnTimeDetailData } from '@/lib/kpiDetailServices/awardNoticeOnTimeService.js';
// Remember to import other KPI services as you create them

const prisma = new PrismaClient();

// Helper function getScopeDetailsFromFiltersForDetail (Your existing implementation)
async function getScopeDetailsFromFiltersForDetail(filterParams = {}) {
    let targetPersonnelIds = [];
    let dataScope = { level: "Organization-Wide", name: "All Teams & Personnel" }; 

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
        const allPersonnel = await prisma.personnel.findMany({ select: { personnelId: true } });
        targetPersonnelIds = allPersonnel.map(p => p.personnelId);
    }
    
    return { targetPersonnelIds, dataScope };
}


export async function GET(request) {
  console.log("--- /api/kpis/detail GET request received ---");
  let kpiNameFromParams = ''; 
  let requestedSnapshotMonthFromParams = ''; // For logging

  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    const decodedToken = await verifyToken(token);
    if (!decodedToken || !decodedToken.userId) return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const kpiName = searchParams.get('kpiName');
    kpiNameFromParams = kpiName; 

    const filterParams = {
        teamId: searchParams.get('teamId') || undefined,
        subTeamId: searchParams.get('subTeamId') || undefined,
        personnelId: searchParams.get('personnelId') || undefined,
    };
    // Get the snapshotMonth from query params
    const requestedSnapshotMonth = searchParams.get('snapshotMonth') || undefined; // <<< READ THIS
    requestedSnapshotMonthFromParams = requestedSnapshotMonth; // For logging

    Object.keys(filterParams).forEach(key => filterParams[key] === undefined && delete filterParams[key]);

    if (!kpiName) {
      return NextResponse.json({ message: 'kpiName query parameter is required.' }, { status: 400 });
    }
    if (!Object.values(KPI_NAMES).includes(kpiName)) {
        console.error("API Detail Route: Validation FAILED for kpiName:", `"${kpiName}"`);
        return NextResponse.json({ message: `Invalid kpiName provided: ${kpiName}` }, { status: 400 });
    }
    
    console.log(`API Detail: User ID: ${decodedToken.userId}, Role: ${decodedToken.role}, Requested KPI: ${kpiName}, Filters:`, filterParams, `Requested Snapshot: ${requestedSnapshotMonth || 'Latest'}`);

    const { targetPersonnelIds, dataScope } = await getScopeDetailsFromFiltersForDetail(filterParams);
    const personnelFilter = targetPersonnelIds.length > 0 ? { personnelId: { in: targetPersonnelIds } } : {};
    
    // Determine the effective snapshot month to use for queries
    let effectiveSnapshotMonth;
    if (requestedSnapshotMonth) {
        effectiveSnapshotMonth = requestedSnapshotMonth;
        console.log(`API Detail: Using requested snapshotMonth: ${effectiveSnapshotMonth}`);
    } else {
        const latestSnapshotRecord = await prisma.contract.findFirst({
            orderBy: { snapshotMonth: 'desc' }, 
            select: { snapshotMonth: true },
            // Optional: you might want to ensure this latest snapshot has data for the current scope/KPI
            // where: { ...personnelFilter, metricName: kpiName } // This could make it slow or complex
        });
        effectiveSnapshotMonth = latestSnapshotRecord?.snapshotMonth;
        console.log(`API Detail: No snapshot requested, using latest found: ${effectiveSnapshotMonth}`);
    }

    if (!effectiveSnapshotMonth) {
        // This case means no snapshot was requested, AND no latest snapshot could be found (e.g., empty DB or no relevant data)
        console.warn("API Detail: No effective snapshot month could be determined. Returning empty/error response.");
        // You might want to return a specific message or an empty valid structure
        return NextResponse.json({ 
            message: 'No snapshot data available for the selected criteria or overall.',
            displayName: kpiName,
            currentSnapshotMonth: "N/A",
            dataScope: dataScope,
            currentValue: { name: kpiName, value: null, unit: '%', status: 'N/A' },
            customStats: {},
            trendData: { labels: [], datasets: [{ label: kpiName, data: [] }] },
            detailTable: { headers: ["Info"], data: [["No data available."]] }
        }, { status: 200 }); // Or 404 if you prefer
    }

    // Initialize responseData template
    let responseData = {
        displayName: kpiName,
        currentSnapshotMonth: effectiveSnapshotMonth, // Use the determined snapshot
        dataScope: dataScope,
        currentValue: { name: kpiName, value: null, unit: '%', status: 'N/A' },
        customStats: {}, 
        trendData: { 
            labels: [], 
            datasets: [{ 
                label: kpiName, 
                data: [], 
                borderColor: '#10B981', 
                tension: 0.1, 
                fill: true, 
                backgroundColor: 'rgba(16, 185, 129, 0.1)' 
            }] 
        },
        detailTable: { headers: [], data: [] }
    };

    // --- Dispatch to KPI-specific service, passing the effectiveSnapshotMonth ---
    if (kpiName === KPI_NAMES.CO_KPI_ON_TIME) {
        responseData = await getCoKpiOnTimeDetailData(prisma, personnelFilter, effectiveSnapshotMonth, kpiName, responseData);
    } 
    else if (kpiName === KPI_NAMES.AWARD_NOTICE_ON_TIME) { 
        responseData = await getAwardNoticeOnTimeDetailData(prisma, personnelFilter, effectiveSnapshotMonth, kpiName, responseData);
    }
    // --- Add 'else if' blocks for other KPIs here, calling their respective services ---
    else {
        console.warn(`Detail logic for KPI '${kpiName}' is not dispatched to a service. Returning template data.`);
        responseData.currentValue = { name: kpiName, value: Math.floor(Math.random() * 100), unit: '?', status: "N/A" };
        responseData.trendData.labels = ['Jan', 'Feb', 'Mar'];
        responseData.trendData.datasets[0].data = [10,20,30];
        responseData.detailTable.headers = ["Info"];
        responseData.detailTable.data = [["Data for this KPI is not yet configured in the API."]];
    }

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error(`Error in /api/kpis/detail (kpiName: ${kpiNameFromParams}, snapshot: ${requestedSnapshotMonthFromParams}):`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: 'Failed to fetch KPI details.', error: errorMessage }, { status: 500 });
  } finally {
    // Ensure prisma disconnects only after all async operations related to it are done.
    // If called too early inside a try block with async calls after it, it might cause issues.
    // It's generally safe in a final `finally` block of the main request handler.
    if (prisma) {
        await prisma.$disconnect().catch(e => console.error("Error disconnecting Prisma:", e));
    }
  }
}