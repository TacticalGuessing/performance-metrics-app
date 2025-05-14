// scripts/ingestData.js
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const prisma = new PrismaClient();

const CSV_FOLDER_PATH = path.join(process.cwd(), 'reports', 'generated'); // Adjust if your CSVs are elsewhere

// Helper function to read and parse a CSV file
async function parseCSV(fileName) {
  const filePath = path.join(CSV_FOLDER_PATH, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`WARNING: CSV file not found: ${filePath}`);
    return [];
  }
  const csvFile = fs.readFileSync(filePath, 'utf8');
  return new Promise((resolve, reject) => {
    Papa.parse(csvFile, {
      header: true,       // Assumes first row is header
      skipEmptyLines: true,
      dynamicTyping: true, // Automatically converts numbers, booleans
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error(`Errors parsing ${fileName}:`, results.errors);
          reject(new Error(`Failed to parse ${fileName}`));
        } else {
          console.log(`Successfully parsed ${fileName}, ${results.data.length} rows found.`);
          resolve(results.data);
        }
      },
      error: (error) => {
        console.error(`PapaParse error for ${fileName}:`, error);
        reject(error);
      }
    });
  });
}

// Helper to clear tables (be careful with order due to foreign keys)
async function clearDatabase() {
  console.log('Clearing existing data...');
  // Order of deletion matters due to foreign key constraints
  // Start with tables that are referenced by others
  await prisma.contract.deleteMany({});
  await prisma.trainingData.deleteMany({});
  // Then tables that reference others, or are at the "end" of a chain
  await prisma.user.deleteMany({}); // If users are linked to personnel, might need to delete users first or handle FKs
  await prisma.personnel.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.subTeam.deleteMany({});
  await prisma.team.deleteMany({});
  console.log('Database cleared.');
}


async function ingestTeams() {
  const teamsData = await parseCSV('Resource_Teams.csv');
  if (teamsData.length === 0) return;

  // Transform data if column names in CSV differ from Prisma model field names
  // Our generator uses snake_case for CSV headers, Prisma model uses camelCase for fields but @map for columns
  // PapaParse with header:true uses CSV headers as keys.
  // Prisma client `createMany` expects data matching model field names.
  // However, since we used @map in Prisma, Prisma client input SHOULD match the Prisma model field names.
  // Let's assume for now CSV headers are team_id, team_name which match the @map in Prisma schema.
  // If not, we'd map: e.g., { teamId: row.team_id, teamName: row.team_name }

  const dataToCreate = teamsData.map(row => ({
    teamId: row.team_id,         // CSV header is team_id, Prisma model field is teamId
    teamName: row.team_name      // CSV header is team_name, Prisma model field is teamName
  }));

  await prisma.team.createMany({
    data: dataToCreate,
    skipDuplicates: true, // Optional: if you might re-run without clearing
  });
  console.log(`Ingested ${dataToCreate.length} teams.`);
}

async function ingestSubTeams() {
  const subTeamsData = await parseCSV('Resource_SubTeams.csv');
  if (subTeamsData.length === 0) return;

  const dataToCreate = subTeamsData.map(row => ({
    subTeamId: row.sub_team_id,
    subTeamName: row.sub_team_name,
    teamId: row.team_id // This refers to the Team model's teamId
  }));

  // ---- ADD LOGGING HERE ----
  console.log("Data being prepared for sub_team insertion (first 5):");
  for (let i = 0; i < Math.min(5, dataToCreate.length); i++) {
      console.log(dataToCreate[i]);
  }
  if (dataToCreate.some(st => !st.subTeamId || !st.teamId)) {
      console.warn("WARNING: Some sub-team records have missing subTeamId or teamId!");
  }
  // --------------------------

  await prisma.subTeam.createMany({
    data: dataToCreate,
    skipDuplicates: true,
  });
  console.log(`Ingested ${dataToCreate.length} sub-teams.`);
}

async function ingestSuppliers() {
    const suppliersData = await parseCSV('Resource_Suppliers.csv');
    if (suppliersData.length === 0) return;

    const dataToCreate = suppliersData.map(row => ({
        supplierId: row.supplier_id,
        supplierName: row.supplier_name,
        country: row.country,
        city: row.city,
        contactEmail: row.contact_email,
        rating: parseFloat(row.rating) // Ensure rating is a float
    }));
    await prisma.supplier.createMany({
        data: dataToCreate,
        skipDuplicates: true,
    });
    console.log(`Ingested ${dataToCreate.length} suppliers.`);
}

async function ingestPersonnel() {
  const personnelData = await parseCSV('Resource_Personnel.csv');
  if (personnelData.length === 0) return;

  const dataToCreate = personnelData.map(row => ({
    personnelId: row.personnel_id,
    personnelName: row.personnel_name,
    email: row.email,
    role: row.role, // This is job title
    subTeamId: row.sub_team_id
  }));

    // ---- ADD LOGGING HERE ----
  console.log("Sample sub_team_ids being prepared for personnel insertion:");
  const subTeamIdsInPersonnelCsv = new Set();
  for (let i = 0; i < Math.min(5, dataToCreate.length); i++) {
      console.log(dataToCreate[i].subTeamId);
      subTeamIdsInPersonnelCsv.add(dataToCreate[i].subTeamId);
  }
  if (dataToCreate.some(p => !p.subTeamId)) { // Check for null/undefined subTeamId
      console.warn("WARNING: Some personnel records have missing subTeamId before insertion!");
  }
  // --------------------------

  await prisma.personnel.createMany({
    data: dataToCreate,
    skipDuplicates: true,
  });
  console.log(`Ingested ${dataToCreate.length} personnel.`);
}

async function ingestTrainingData() {
  const trainingCsvData = await parseCSV('HR_Personnel_Training_ALL_SNAPSHOTS.csv');
  if (trainingCsvData.length === 0) return;

  const dataToCreate = trainingCsvData.map(row => ({
    personnelId: row.personnel_id,
    snapshotMonth: row.snapshot_month,
    trainingModuleId: row.training_module_id,
    trainingModuleName: row.training_module_name,
    trainingStatus: row.training_status,
    completionPercentage: row.completion_percentage ? parseInt(row.completion_percentage) : null,
    trainingCompletionDate: row.training_completion_date ? new Date(row.training_completion_date) : null,
    trainingDueDate: row.training_due_date ? new Date(row.training_due_date) : null,
  }));

  await prisma.trainingData.createMany({
    data: dataToCreate,
    skipDuplicates: true, // Based on your @@unique constraint in Prisma schema
  });
  console.log(`Ingested ${dataToCreate.length} training records.`);
}


// --- Contract Data Ingestion (This is the most complex) ---
// We need to define our KPIs and how to calculate/derive them from the raw CSV contract data.
const KPI_DEFINITIONS = {
    CO_KPI_ON_TIME: "CO KPI On Time", // Boolean (1 for on time, 0 for not, -1 or null for N/A)
    AWARD_NOTICE_ON_TIME: "Award Notice On Time", // Boolean
    UK01_NOTICE_ON_TIME: "UK01 Notice On Time", // Boolean
    CONTRACT_OVERSPEND_PERCENT: "Contract Overspend %", // Percentage
    CONTRACT_CLOSURE_ON_TIME: "Contract Closure On Time", // Boolean
    SOCIAL_VALUE_MET: "Social Value Met", // Boolean
    SME_AWARDED: "SME Awarded", // Boolean
    COMPETITIVELY_TENDERED: "Competitively Tendered", // Boolean
    CABINET_OFFICE_CONDITIONS_MET: "Cabinet Office Conditions Met", // Boolean (all conditions A, B, C met)
    // KPI #9 "Mandatory Training" is derived from trainingData, not directly from contract CSV
};

function calculateContractKPIs(contractRow) {
    const kpiValues = [];
    const {
        contract_id, snapshot_month, personnel_id, supplier_id,
        co_kpi_target_completion_date, co_kpi_actual_completion_date,
        award_notice_required_by_date, award_notice_published_date,
        uk01_notice_required_by_date, uk01_notice_published_date,
        contract_budget_value, contract_actual_spend,
        contract_expiry_date, contract_closure_target_date, contract_actual_closure_date,
        has_social_value_commitment, is_sme_awarded, was_competitively_tendered,
        cabinet_office_condition_A_met, cabinet_office_condition_B_met, cabinet_office_condition_C_met
    } = contractRow;

    const targetDate = (dateStr) => dateStr ? new Date(dateStr) : null;
    const actualDate = (dateStr) => dateStr ? new Date(dateStr) : null;

    // 1. CO KPI On Time
    const coTarget = targetDate(co_kpi_target_completion_date);
    const coActual = actualDate(co_kpi_actual_completion_date);
    let coKpiValue = null;
    if (coActual && coTarget) coKpiValue = coActual <= coTarget ? 1 : 0;
    else if (coTarget && !coActual && coTarget < new Date()) coKpiValue = 0; // Overdue if target passed and no actual
    kpiValues.push({ metricName: KPI_DEFINITIONS.CO_KPI_ON_TIME, value: coKpiValue, valueType: 'boolean_flag' });

    // 2. Award Notice On Time
    const awardTarget = targetDate(award_notice_required_by_date);
    const awardActual = actualDate(award_notice_published_date);
    let awardNoticeValue = null;
    if (awardActual && awardTarget) awardNoticeValue = awardActual <= awardTarget ? 1 : 0;
    else if (awardTarget && !awardActual && awardTarget < new Date()) awardNoticeValue = 0;
    kpiValues.push({ metricName: KPI_DEFINITIONS.AWARD_NOTICE_ON_TIME, value: awardNoticeValue, valueType: 'boolean_flag' });
    
    // 3. UK01 Notice On Time
    const uk01Target = targetDate(uk01_notice_required_by_date);
    const uk01Actual = actualDate(uk01_notice_published_date);
    let uk01NoticeValue = null;
    if (uk01Actual && uk01Target) uk01NoticeValue = uk01Actual <= uk01Target ? 1 : 0;
    else if (uk01Target && !uk01Actual && uk01Target < new Date()) uk01NoticeValue = 0;
    kpiValues.push({ metricName: KPI_DEFINITIONS.UK01_NOTICE_ON_TIME, value: uk01NoticeValue, valueType: 'boolean_flag' });

    // 4. Contract Overspend %
    let overspendPercent = null;
    if (typeof contract_budget_value === 'number' && typeof contract_actual_spend === 'number' && contract_budget_value > 0) {
        overspendPercent = ((contract_actual_spend - contract_budget_value) / contract_budget_value) * 100;
        // We store the percentage. 0% overspend is the target for the KPI.
    }
    kpiValues.push({ metricName: KPI_DEFINITIONS.CONTRACT_OVERSPEND_PERCENT, value: overspendPercent, valueType: 'percentage' });

    // 5. Contract Closure On Time
    const closureTarget = targetDate(contract_closure_target_date);
    const closureActual = actualDate(contract_actual_closure_date);
    let closureValue = null;
    if (closureActual && closureTarget) closureValue = closureActual <= closureTarget ? 1 : 0;
    else if (closureTarget && !closureActual && closureTarget < new Date()) closureValue = 0;
    kpiValues.push({ metricName: KPI_DEFINITIONS.CONTRACT_CLOSURE_ON_TIME, value: closureValue, valueType: 'boolean_flag' });

    // 6. Social Value Met
    kpiValues.push({ metricName: KPI_DEFINITIONS.SOCIAL_VALUE_MET, value: has_social_value_commitment ? 1 : 0, valueType: 'boolean_flag' });
    
    // 7. SME Awarded
    kpiValues.push({ metricName: KPI_DEFINITIONS.SME_AWARDED, value: is_sme_awarded ? 1 : 0, valueType: 'boolean_flag' });
    
    // 8. Competitively Tendered
    kpiValues.push({ metricName: KPI_DEFINITIONS.COMPETITIVELY_TENDERED, value: was_competitively_tendered ? 1 : 0, valueType: 'boolean_flag' });

    // 10. Cabinet Office Conditions Met (KPI #10, assuming KPI #9 is training)
    const allCoConditionsMet = cabinet_office_condition_A_met && cabinet_office_condition_B_met && cabinet_office_condition_C_met;
    kpiValues.push({ metricName: KPI_DEFINITIONS.CABINET_OFFICE_CONDITIONS_MET, value: allCoConditionsMet ? 1 : 0, valueType: 'boolean_flag' });

    return kpiValues.map(kpi => ({
        contractId: contract_id,
        snapshotMonth: snapshot_month,
        personnelId: personnel_id,
        supplierId: supplier_id, // Add supplier_id here
        metricName: kpi.metricName,
        value: kpi.value,
        valueType: kpi.valueType,
        // dateAssociated could be the snapshot_month's first day, or specific event dates
        dateAssociated: new Date(snapshot_month + '-01') 
    }));
}


async function ingestContractData() {
  const contractCsvData = await parseCSV('CMS_Contract_Compliance_ALL_SNAPSHOTS.csv');
  if (contractCsvData.length === 0) return;

  let allDbContractRecords = [];
  for (const row of contractCsvData) {
    const kpiRecordsForDb = calculateContractKPIs(row);
    allDbContractRecords.push(...kpiRecordsForDb);
  }
  
  // Batch insert if possible, or chunk it for very large datasets
  // Prisma createMany is generally efficient.
  if (allDbContractRecords.length > 0) {
    // Filter out records where value is null, as some KPIs might not be applicable yet
    const validRecords = allDbContractRecords.filter(r => r.value !== null && r.value !== undefined);

    // ---- ADD LOGGING HERE ----
    console.log("Sample supplier_ids being prepared for contract insertion:");
    for (let i = 0; i < Math.min(5, validRecords.length); i++) { // Log first 5
        console.log(validRecords[i].supplierId);
    }
    if (validRecords.some(r => !r.supplierId)) {
        console.warn("WARNING: Some contract records have missing supplierId before insertion!");
    }
    // --------------------------
    
    await prisma.contract.createMany({
      data: validRecords,
      skipDuplicates: true, // Based on your @@unique([contractId, snapshotMonth, metricName])
    });
    console.log(`Ingested ${validRecords.length} contract metric records from ${contractCsvData.length} CSV rows.`);
  } else {
    console.log("No valid contract metric records to ingest.");
  }
}


// Main ingestion function
async function main() {
  try {
    await clearDatabase(); // Optional: clear DB before ingest

    await ingestTeams();
    await ingestSubTeams();
    await ingestSuppliers(); // Ingest suppliers before personnel if personnel might reference them (not current schema)
                           // or before contracts if contracts reference them
    await ingestPersonnel(); // Ingest personnel before contracts and training

    await ingestContractData();
    await ingestTrainingData();

    console.log('Data ingestion complete!');
  } catch (error) {
    console.error('Ingestion failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();