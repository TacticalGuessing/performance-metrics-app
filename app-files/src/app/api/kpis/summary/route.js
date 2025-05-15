// src/app/api/kpis/summary/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// Ensure path alias or relative path is correct
import { getTokenFromRequest, verifyToken } from '@/lib/authUtils.js';
import { KPI_NAMES } from '@/lib/kpiConstants.js';

const prisma = new PrismaClient();



// Helper function to determine target personnel IDs and data scope name based on filters
async function getScopeDetailsFromFilters(filterParams = {}) {
    let targetPersonnelIds = [];
    let dataScope = { level: "Organisation-Wide", name: "All Teams & Personnel" }; // Default

    if (filterParams.personnelId) {
        targetPersonnelIds = [filterParams.personnelId];
        const p = await prisma.personnel.findUnique({
            where: { personnelId: filterParams.personnelId },
            select: { personnelName: true }
        });
        dataScope = { level: "Individual", name: p ? p.personnelName : `Personnel ID: ${filterParams.personnelId}` };
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

// Helper for boolean/percentage KPIs from contractMetrics
const calculateBooleanKpi = (metricName, contractMetricsForKpi) => {
    const relevantMetrics = contractMetricsForKpi.filter(m => m.metricName === metricName);
    if (relevantMetrics.length === 0) {
        return { name: metricName, value: null, unit: '%', status: 'N/A' };
    }
    const successful = relevantMetrics.filter(m => m.value === "1").length; // Assuming 1 is success
    const percentage = (successful / relevantMetrics.length) * 100;
    
    let status = 'N/A';
    if (percentage !== null && !isNaN(percentage)) { // Added !isNaN check
        // Define status thresholds (example)
        // These thresholds should be business-defined per KPI
        if (metricName === KPI_NAMES.SME_AWARDED) { 
            if (percentage >= 25) status = 'Good'; 
            else if (percentage >= 15) status = 'Ok';
            else status = 'Bad';
        } else { // Default thresholds for "on time" / "met" style KPIs
            if (percentage >= 95) status = 'Good';
            else if (percentage >= 80) status = 'Ok';
            else status = 'Bad';
        }
    }

    return { 
        name: metricName, 
        value: parseFloat(percentage.toFixed(1)), 
        unit: '%', 
        status: status
    };
};


export async function GET(request) {
    console.log("--- /api/kpis/summary GET request received ---");
    try {
        // ... (token verification, filter param extraction, latestSnapshot, getScopeDetailsFromFilters - ALL THIS REMAINS THE SAME) ...
        const token = getTokenFromRequest(request); /* ... */ const decodedToken = await verifyToken(token); /* ... */
        const { searchParams } = new URL(request.url);
        const filterParams = { /* ... extract filter params ... */ };
        const latestSnapshotRecord = await prisma.contract.findFirst({orderBy: { snapshotMonth: 'desc' }, select: { snapshotMonth: true }});
        const latestSnapshot = latestSnapshotRecord?.snapshotMonth;
        if (!latestSnapshot) { /* ... return 404 ... */ }
        const { targetPersonnelIds, dataScope } = await getScopeDetailsFromFilters(filterParams);
        console.log(`API: Scope - Level: ${dataScope.level}, Name: ${dataScope.name}, Personnel Count: ${targetPersonnelIds.length}, Snapshot: ${latestSnapshot}`);

        let fetchMetricsAllowed = true;
        if (targetPersonnelIds.length === 0 && !(dataScope.level === "Organization-Wide" && (await prisma.personnel.count() === 0) )) {
            fetchMetricsAllowed = false;
        }
        
        let contractMetricsForKpiCalc = []; // This will hold data for most KPIs
        let trainingMetricsData = [];
        let liveContractStats = { count: 0, totalValue: 0.00 };
        // For contractDataForStats (live contract calculation)
        let contractDataForStatsQuery = []; 


        if (fetchMetricsAllowed) {
            const personnelFilter = targetPersonnelIds.length > 0 ? { personnelId: { in: targetPersonnelIds } } : {};
            
            // Fetch metrics needed for KPI cards AND for the live contract stats calculation
            // This query now fetches everything needed from the 'contracts' table in one go.
            const allRelevantContractMetrics = await prisma.contract.findMany({
                where: {
                    snapshotMonth: latestSnapshot,
                    ...personnelFilter,
                    metricName: { 
                        in: Object.values(KPI_NAMES) // Fetch all defined KPI names
                                .filter(name => name !== KPI_NAMES.MANDATORY_TRAINING_COMPLETION) // Exclude training
                    }
                },
                select: { contractId: true, metricName: true, value: true } // Select contractId for live stats mapping
            });

            // Separate data for KPI calculations vs. live stats
            contractMetricsForKpiCalc = allRelevantContractMetrics.filter(
                m => m.metricName !== KPI_NAMES.CONTRACT_STATUS_TEXT && m.metricName !== KPI_NAMES.CONTRACT_BUDGET_VALUE
            );
            contractDataForStatsQuery = allRelevantContractMetrics.filter(
                m => m.metricName === KPI_NAMES.CONTRACT_STATUS_TEXT || m.metricName === KPI_NAMES.CONTRACT_BUDGET_VALUE
            );
            
            console.log("API: Number of rows fetched for KPI calcs:", contractMetricsForKpiCalc.length);
            console.log("API: Number of rows fetched for live stats:", contractDataForStatsQuery.length);


            // --- Calculate Live Contract Stats (using contractDataForStatsQuery) ---
            const liveContractsMap = new Map();
            contractDataForStatsQuery.forEach(c => {
                if (!liveContractsMap.has(c.contractId)) {
                    liveContractsMap.set(c.contractId, { isLive: false, budget: 0 });
                }
                const entry = liveContractsMap.get(c.contractId);
                if (c.metricName === KPI_NAMES.CONTRACT_STATUS_TEXT && typeof c.value === 'string' && c.value.toLowerCase() === 'active') {
                    entry.isLive = true;
                }
                if (c.metricName === KPI_NAMES.CONTRACT_BUDGET_VALUE && c.value !== null) {
                    const budgetNum = parseFloat(c.value);
                    if (!isNaN(budgetNum)) entry.budget = budgetNum;
                }
            });
            let liveCount = 0; let totalLiveValue = 0.0;
            liveContractsMap.forEach(details => {
                if (details.isLive) {
                    liveCount++;
                    totalLiveValue += details.budget;
                }
            });
            console.log("API: liveContractsMap processed. Live count:", liveCount, "Total Live Value:", totalLiveValue);
            liveContractStats = { count: liveCount, totalValue: parseFloat(totalLiveValue.toFixed(2)) };


            // Fetch training data (remains the same)
            trainingMetricsData = await prisma.trainingData.findMany({
                where: { snapshotMonth: latestSnapshot, ...personnelFilter, },
                select: { trainingStatus: true, completionPercentage: true, personnelId: true, trainingModuleId: true }
            });
        } else {
            console.log("API: Skipping metric fetching due to scope or lack of personnel.");
        }
        
        // --- Calculate All KPIs ---
        const calculatedKpis = [];
        
        // Use calculateBooleanKpi for these
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.CO_KPI_ON_TIME, contractMetricsForKpiCalc));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.AWARD_NOTICE_ON_TIME, contractMetricsForKpiCalc));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.UK01_NOTICE_ON_TIME, contractMetricsForKpiCalc));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.SOCIAL_VALUE_MET, contractMetricsForKpiCalc));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.SME_AWARDED, contractMetricsForKpiCalc));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.COMPETITIVELY_TENDERED, contractMetricsForKpiCalc));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.CABINET_OFFICE_CONDITIONS_MET, contractMetricsForKpiCalc));

        // **NEW "Closures" KPI calculation using "Expired Contract Is Closed"**
        const closuresKpiResult = calculateBooleanKpi(KPI_NAMES.EXPIRED_CONTRACT_IS_CLOSED, contractMetricsForKpiCalc);
        calculatedKpis.push({
            name: "Closures", // This is the display name for the card
            value: closuresKpiResult.value,
            unit: closuresKpiResult.unit,
            status: closuresKpiResult.status
        });
        
        // **FIXED "Overspend %" KPI calculation**
        const overspendMetrics = contractMetricsForKpiCalc.filter(m => m.metricName === KPI_NAMES.CONTRACT_OVERSPEND_PERCENT);
        let avgOverspend = null;
        let overspendStatus = 'N/A';
        if (overspendMetrics.length > 0) {
            let totalOverspendValue = 0;
            let countValidOverspendMetrics = 0;
            overspendMetrics.forEach(m => {
                if (m.value !== null && m.value !== undefined && m.value !== "null") { // Check for string "null" too
                    const numericValue = parseFloat(m.value); // Value from DB is string
                    if (!isNaN(numericValue)) {
                        totalOverspendValue += numericValue;
                        countValidOverspendMetrics++;
                    } else {
                         console.warn(`Could not parse overspend value: '${m.value}' for a contract metric.`);
                    }
                }
            });
            if (countValidOverspendMetrics > 0) {
                avgOverspend = parseFloat((totalOverspendValue / countValidOverspendMetrics).toFixed(1));
                overspendStatus = avgOverspend <= 0 ? 'Good' : avgOverspend <= 5 ? 'Ok' : 'Bad';
            } else {
                console.log("No valid numeric overspend metrics found to calculate average for this scope.");
            }
        } else {
            console.log("No metrics found with metricName:", KPI_NAMES.CONTRACT_OVERSPEND_PERCENT, "for this scope.");
        }
        calculatedKpis.push({ name: KPI_NAMES.CONTRACT_OVERSPEND_PERCENT, value: avgOverspend, unit: '%', status: overspendStatus });
        
        // Mandatory Training Completion (logic should be complete from your previous working version)
        let mandatoryTrainingValue = null; 
        let trainingKpiStatus = 'N/A';
        const uniquePersonnelIdsInScope = [...new Set(targetPersonnelIds)];
        let numUniqueMandatoryModules = 4; // Fallback
        if (trainingMetricsData.length > 0) {
            const moduleIds = new Set(trainingMetricsData.map(t => t.trainingModuleId));
            if (moduleIds.size > 0) numUniqueMandatoryModules = moduleIds.size;
        } else {
            const allSnapshotModules = await prisma.trainingData.groupBy({ by: ['trainingModuleId'], where: { snapshotMonth: latestSnapshot }});
            if (allSnapshotModules.length > 0) numUniqueMandatoryModules = allSnapshotModules.length;
        }
        if (uniquePersonnelIdsInScope.length > 0 && numUniqueMandatoryModules > 0) {
            const totalPossibleModules = uniquePersonnelIdsInScope.length * numUniqueMandatoryModules;
            if (totalPossibleModules > 0) {
                const completedModules = trainingMetricsData.filter(t => (t.trainingStatus === 'Completed' || t.completionPercentage === 100) && uniquePersonnelIdsInScope.includes(t.personnelId)).length;
                mandatoryTrainingValue = parseFloat(((completedModules / totalPossibleModules) * 100).toFixed(1));
                mandatoryTrainingValue = Math.min(100, Math.max(0, mandatoryTrainingValue));
                trainingKpiStatus = mandatoryTrainingValue >= 95 ? 'Good' : mandatoryTrainingValue >= 80 ? 'Ok' : 'Bad';
            }
        } else if (uniquePersonnelIdsInScope.length === 0 && dataScope.level === "Organization-Wide" && (await prisma.personnel.count() === 0)) {
             trainingKpiStatus = 'N/A';
        }
        calculatedKpis.push({ name: KPI_NAMES.MANDATORY_TRAINING_COMPLETION, value: mandatoryTrainingValue, unit: '%', status: trainingKpiStatus });

        console.log("API: Successfully calculated KPIs and live contract stats. Returning response.");
        return NextResponse.json({ 
            kpis: calculatedKpis, 
            snapshotMonth: latestSnapshot,
            dataScope: dataScope,
            liveContractStats: liveContractStats
        }, { status: 200 });

    } catch (error) {
        console.error("Error in /api/kpis/summary:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ message: 'Failed to fetch KPI summary.', error: errorMessage }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}