// src/app/api/kpis/summary/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// Ensure path alias or relative path is correct
import { getTokenFromRequest, verifyToken } from '@/lib/authUtils.js';

const prisma = new PrismaClient();

// KPI Definitions (consistent with ingestion script)
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

// Helper function to determine target personnel IDs and data scope name
async function getScopeDetails(userRoleFromToken, authenticatedUserId) {
    let targetPersonnelIds = [];
    let dataScope = {
        level: "Unknown Scope",
        name: "Data scope not determined"
    };

    if (!authenticatedUserId) {
        return { targetPersonnelIds, dataScope };
    }

    const userRecord = await prisma.user.findUnique({
        where: { userId: authenticatedUserId },
        select: { 
            personnelId: true, 
            role: true, 
            name: true  
        } 
    });

    if (!userRecord) {
        dataScope.name = "User record not found";
        return { targetPersonnelIds, dataScope };
    }
    
    const effectiveUserRole = userRecord.role; 
    const userPersonnelId = userRecord.personnelId;

    if (effectiveUserRole === 'admin' || effectiveUserRole === 'director') {
        const allPersonnel = await prisma.personnel.findMany({
            select: { personnelId: true },
        });
        targetPersonnelIds = allPersonnel.map(p => p.personnelId);
        dataScope = { level: "Organization-Wide", name: "All Teams & Personnel" };

    } else if (effectiveUserRole === 'team_leader') {
        if (userPersonnelId) {
            const leaderPersonnelRecord = await prisma.personnel.findUnique({
                where: { personnelId: userPersonnelId },
                include: { 
                    subTeam: { 
                        include: { 
                            team: true 
                        } 
                    } 
                }
            });
            if (leaderPersonnelRecord && leaderPersonnelRecord.subTeam && leaderPersonnelRecord.subTeam.team) {
                const teamMembers = await prisma.personnel.findMany({
                    where: { subTeamId: leaderPersonnelRecord.subTeamId },
                    select: { personnelId: true },
                });
                targetPersonnelIds = teamMembers.map(p => p.personnelId);
                dataScope = { 
                    level: "Sub-Team", 
                    name: `${leaderPersonnelRecord.subTeam.team.teamName} - ${leaderPersonnelRecord.subTeam.subTeamName}` 
                };
            } else {
                dataScope = { level: "Team Leader (Limited Scope)", name: leaderPersonnelRecord ? leaderPersonnelRecord.personnelName : userRecord.name };
                if (leaderPersonnelRecord) targetPersonnelIds = [leaderPersonnelRecord.personnelId];
            }
        } else {
            dataScope = { level: "Team Leader (Unlinked)", name: userRecord.name + " - Not linked to Personnel record" };
        }
    } else if (effectiveUserRole === 'user') {
        if (userPersonnelId) {
            targetPersonnelIds = [userPersonnelId];
            const userPersonnelRecord = await prisma.personnel.findUnique({
                where: { personnelId: userPersonnelId }
            });
            dataScope = { 
                level: "Individual", 
                name: userPersonnelRecord ? userPersonnelRecord.personnelName : userRecord.name 
            };
        } else {
            dataScope = { level: "Individual (Unlinked)", name: userRecord.name + " - Not linked to Personnel record" };
        }
    } else {
         dataScope = { level: "User Scope (Unrecognized Role)", name: userRecord.name };
    }
    return { targetPersonnelIds, dataScope };
}

// Helper for boolean KPIs (On Time, Met, Awarded, Tendered)
const calculateBooleanKpi = (metricName, contractMetrics) => {
    const relevantMetrics = contractMetrics.filter(m => m.metricName === metricName);
    if (relevantMetrics.length === 0) return { name: metricName, value: null, unit: '%', status: 'N/A' };
    const successful = relevantMetrics.filter(m => m.value === 1).length; // Assuming 1 is success
    const percentage = (successful / relevantMetrics.length) * 100;
    // Define status thresholds (example)
    let status = 'N/A';
    if (percentage >= 95) status = 'Good'; // Stricter for "Good"
    else if (percentage >= 80) status = 'Ok';
    else if (percentage !== null) status = 'Bad';

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
        const token = getTokenFromRequest(request);
        if (!token) {
            return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
        }
        const decodedToken = await verifyToken(token);
        if (!decodedToken || !decodedToken.userId) {
            return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
        }

        const authenticatedUserId = decodedToken.userId;
        const userRoleFromToken = decodedToken.role; 

        const latestSnapshotRecord = await prisma.contract.findFirst({
            orderBy: { snapshotMonth: 'desc' },
            select: { snapshotMonth: true },
        });
        if (!latestSnapshotRecord || !latestSnapshotRecord.snapshotMonth) {
            return NextResponse.json({ message: 'No snapshot data found.' }, { status: 404 });
        }
        const latestSnapshot = latestSnapshotRecord.snapshotMonth;
        
        console.log(`API: User role from token: ${userRoleFromToken}, User ID: ${authenticatedUserId}, Snapshot: ${latestSnapshot}`);

        const { targetPersonnelIds, dataScope } = await getScopeDetails(userRoleFromToken, authenticatedUserId);

        console.log(`API: Determined Data Scope - Level: ${dataScope.level}, Name: ${dataScope.name}, Personnel Count: ${targetPersonnelIds.length}`);

        if (targetPersonnelIds.length === 0 && !(dataScope.level === "Organization-Wide" && (await prisma.personnel.count() === 0) )) {
            // Allow org-wide to proceed if there are truly no personnel in the DB yet, otherwise return empty
            console.warn("API: No target personnel IDs for data fetching. Returning empty KPIs for scope:", dataScope.name);
            const emptyKpis = Object.values(KPI_NAMES).map(name => ({ 
                name, value: null, 
                unit: (name === KPI_NAMES.CONTRACT_OVERSPEND_PERCENT || name === KPI_NAMES.MANDATORY_TRAINING_COMPLETION) ? '%' : 'status', 
                status: 'N/A' 
            }));
            return NextResponse.json({ kpis: emptyKpis, snapshotMonth: latestSnapshot, dataScope }, { status: 200 });
        }
        
        const contractMetrics = await prisma.contract.findMany({
            where: {
                snapshotMonth: latestSnapshot,
                ...(targetPersonnelIds.length > 0 && { personnelId: { in: targetPersonnelIds } }),
                metricName: { in: Object.values(KPI_NAMES).filter(name => name !== KPI_NAMES.MANDATORY_TRAINING_COMPLETION) } // Exclude training
            },
            select: { metricName: true, value: true }
        });

        const trainingMetricsData = await prisma.trainingData.findMany({
            where: {
                snapshotMonth: latestSnapshot,
                ...(targetPersonnelIds.length > 0 && { personnelId: { in: targetPersonnelIds } }),
            },
            select: { trainingStatus: true, completionPercentage: true, personnelId: true }
        });

        const calculatedKpis = [];

        // Calculate boolean/percentage based KPIs from contractMetrics
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.CO_KPI_ON_TIME, contractMetrics));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.AWARD_NOTICE_ON_TIME, contractMetrics));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.UK01_NOTICE_ON_TIME, contractMetrics));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.CONTRACT_CLOSURE_ON_TIME, contractMetrics));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.SOCIAL_VALUE_MET, contractMetrics));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.SME_AWARDED, contractMetrics));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.COMPETITIVELY_TENDERED, contractMetrics));
        calculatedKpis.push(calculateBooleanKpi(KPI_NAMES.CABINET_OFFICE_CONDITIONS_MET, contractMetrics));

        // KPI: Contract Overspend %
        const overspendMetrics = contractMetrics.filter(m => m.metricName === KPI_NAMES.CONTRACT_OVERSPEND_PERCENT && typeof m.value === 'number');
        let avgOverspend = null;
        let overspendStatus = 'N/A';
        if (overspendMetrics.length > 0) {
            const totalOverspend = overspendMetrics.reduce((sum, m) => sum + m.value, 0);
            avgOverspend = parseFloat((totalOverspend / overspendMetrics.length).toFixed(1));
            overspendStatus = avgOverspend <= 0 ? 'Good' : avgOverspend <= 5 ? 'Ok' : 'Bad'; // Target is 0% or less
        }
        calculatedKpis.push({ name: KPI_NAMES.CONTRACT_OVERSPEND_PERCENT, value: avgOverspend, unit: '%', status: overspendStatus });
        
        // KPI: Mandatory Training Completion
        let mandatoryTrainingValue = null; 
        let trainingKpiStatus = 'N/A';
        // Define how many unique mandatory training modules exist
        const uniqueMandatoryTrainingModules = await prisma.trainingData.groupBy({
            by: ['trainingModuleId'],
            where: { snapshotMonth: latestSnapshot }, // Consider only modules present in this snapshot
        });
        const NUM_MANDATORY_MODULES_PER_PERSON = uniqueMandatoryTrainingModules.length > 0 ? uniqueMandatoryTrainingModules.length : 4; // Fallback to 4 if no training data yet

        if (targetPersonnelIds.length > 0 && NUM_MANDATORY_MODULES_PER_PERSON > 0) {
            const totalPossibleModules = targetPersonnelIds.length * NUM_MANDATORY_MODULES_PER_PERSON;
            if (totalPossibleModules > 0) {
                const completedModules = trainingMetricsData.filter(
                    t => t.trainingStatus === 'Completed' || t.completionPercentage === 100
                ).length;
                mandatoryTrainingValue = parseFloat(((completedModules / totalPossibleModules) * 100).toFixed(1));
                mandatoryTrainingValue = Math.min(100, Math.max(0, mandatoryTrainingValue)); // Clamp between 0 and 100
                trainingKpiStatus = mandatoryTrainingValue >= 95 ? 'Good' : mandatoryTrainingValue >= 80 ? 'Ok' : 'Bad';
            }
        } else if (dataScope.level === "Organization-Wide" && (await prisma.personnel.count() === 0)) {
             // If admin view and no personnel in system, it's N/A or 100% based on policy
             trainingKpiStatus = 'N/A'; // Or 'Good' with value 100
        }
        calculatedKpis.push({ name: KPI_NAMES.MANDATORY_TRAINING_COMPLETION, value: mandatoryTrainingValue, unit: '%', status: trainingKpiStatus });

        console.log("API: Successfully calculated KPIs. Returning response.");
        return NextResponse.json({ 
            kpis: calculatedKpis, 
            snapshotMonth: latestSnapshot,
            dataScope: dataScope 
        }, { status: 200 });

    } catch (error) {
        console.error("Error in /api/kpis/summary:", error);
        return NextResponse.json({ message: 'Failed to fetch KPI summary.', error: error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}