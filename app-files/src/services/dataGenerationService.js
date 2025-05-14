// src/services/dataGenerationService.js

// --- Helper Functions (Paste all your generateXYZ functions here) ---
function generateTeams(numTeams = 5) {
  const teams = [];
  const teamBaseNames = ["Networks", "Software", "Hardware", "Space", "Professional Services", "Cyber", "Logistics", "Intelligence", "Research", "Development", "Operations", "Support"];
  for (let i = 1; i <= numTeams; i++) {
    const nameIndex = (i - 1) % teamBaseNames.length;
    // Construct name without "Team" suffix by default
    let teamName = teamBaseNames[nameIndex];
    if (Math.floor(i / teamBaseNames.length) > 0) {
        teamName += ` ${Math.floor(i / teamBaseNames.length) + 1}`; // e.g., Networks 2, if we loop through base names
    }
    teams.push({
      team_id: `T${String(i).padStart(3, '0')}`,
      team_name: teamName.trim(),
    });
  }
  return teams;
}

function generateSubTeams(teams, avgSubTeamsPerTeam = 3) {
  const subTeams = [];
  let globalSubTeamCounter = 1; // For unique STxxx IDs
  const unitDesignators = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Gamma", "Omega", "Zeta", "Iota", "Kappa", "Lambda"]; // Added more

  teams.forEach(team => {
    const numSubTeamsThisTeam = Math.max(1, Math.floor(Math.random() * (avgSubTeamsPerTeam * 1.5) +1)); // Make it a bit more varied
    for (let i = 1; i <= numSubTeamsThisTeam; i++) {
      // Use 'i' or a letter based on 'i' to ensure uniqueness within this team's sub-teams
      // String.fromCharCode(64 + i) gives A, B, C...
      // Or use the unitDesignators but ensure 'i' doesn't exceed its length for THIS team.
      let unitSuffix;
      if (i <= unitDesignators.length) {
        unitSuffix = unitDesignators[i-1];
      } else {
        unitSuffix = `Unit ${i}`; // Fallback if we generate more subteams than designators
      }
      
      subTeams.push({
        sub_team_id: `ST${String(globalSubTeamCounter++).padStart(3, '0')}`,
        team_id: team.team_id,
        sub_team_name: `${team.team_name} - ${unitSuffix}`, 
      });
    }
  });
  return subTeams;
}

function generatePersonnel(subTeams, avgPersonnelPerSubTeam = 20) {
  const personnel = [];
  let personnelCounter = 1;
  const firstNames = [
    "Alex", "Jamie", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Skyler", "Devon", "Drew",
    "Cameron", "Craig", "Avery", "Parker", "Quinn", "Rowan", "Hayden", "Peyton", "Dakota", "Blake", "Logan",
    "Olivia", "Liam", "Emma", "Noah", "Ava", "Oliver", "Isabella", "Elijah", "Sophia", "Lucas",
    "Mia", "Mason", "Amelia", "Ethan", "Harper", "Logan", "Evelyn", "Aiden", "Abigail", "Jackson",
    "Emily", "Carter", "Elizabeth", "Jayden", "Sofia", "Muhammad", "Aisha", "Kenji", "Sakura", "Gump"
  ];
  const lastNames = [
    "Smith", "Jones", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Garcia", "Lee",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Perez", "Sanchez", "Ramirez", "Torres", "Flores",
    "Nguyen", "Tran", "Kim", "Park", "Chen", "Lin", "Wang", "Li", "Singh", "Patel",
    "Schmidt", "Muller", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
    "Dubois", "Bernard", "Thomas", "Robert", "Richard", "Petit", "Shell", "Durand", "Leroy", "Moreau", "Simon", "Goober"
  ];
  const roles = ["Senior Manager", "Project Lead", "Master Assassin", "Lead Engineer", "Data Analyst", "Cleric", "System Architect", "Compliance Officer", "Contract Specialist", "Junior Developer", "Program Manager", "Technical Writer", "QA Tester", "Solutions Architect"];

  subTeams.forEach(subTeam => {
    const numPersonnel = Math.max(5, Math.floor(Math.random() * (avgPersonnelPerSubTeam * 1.5 - avgPersonnelPerSubTeam * 0.5) + avgPersonnelPerSubTeam * 0.5)); // +/- 50% of avg
    for (let i = 1; i <= numPersonnel; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      // Assign roles - more Team Leaders in smaller sub-teams, one Director overall etc.
      // This role logic can be much more sophisticated.
      let role = roles[Math.floor(Math.random() * (roles.length - 2)) + 2]; // Avoid Director/Team Leader initially for most
      if (i === 1 && Math.random() < 0.3) role = "Team Leader"; // ~30% chance first person is Team Leader

      // ****** ADD THESE LINES BACK / DEFINE THEM HERE ******
      const emailSuffixes = ["@example.gov", "@contractorg.com", "@dept.example.org"];
      const emailSuffix = emailSuffixes[Math.floor(Math.random() * emailSuffixes.length)];
      const emailNamePart = `${firstName.toLowerCase().replace(/[^a-z0-9]/gi, '')}.${lastName.toLowerCase().replace(/[^a-z0-9]/gi, '')}`;
      // ******************************************************

      personnel.push({
        personnel_id: `P${String(personnelCounter++).padStart(4, '0')}`,
        personnel_name: `${firstName} ${lastName}`,
        sub_team_id: subTeam.sub_team_id,
        role: role, // More sophisticated role assignment needed for Directors etc.
        email: `${emailNamePart}${personnelCounter % 100}${emailSuffix}`
      });
    }
  });

  // Ensure at least one Director if none assigned (simple assignment for now)
  if (personnel.length > 0) {
      let directorAssigned = false;
      for(let p of personnel){
          if(p.role === "Director"){
              directorAssigned = true;
              break;
          }
      }
      if(!directorAssigned){
          const directorIndex = Math.floor(Math.random() * personnel.length);
          personnel[directorIndex].role = "Director";
      }
  }
  return personnel;
}

// --- NEW Helper Function: generateContractData ---
function generateContractData(personnelList, supplierList, numMonthsToGenerate, avgNewContractsPerMonth = 10, healthModifiers = {}) {
  const contracts = [];
  let contractCounter = 1;
  const contractNames = ["System Upgrade Phase", "Support Services Agreement", "Research & Development Grant", "Infrastructure Maintenance", "Software License Renewal", "Consulting Services for Project", "Equipment Procurement ID"];
  const today = new Date();

  for (let m = 0; m < numMonthsToGenerate; m++) {
    // Go back m months from current month for snapshot
    const snapshotDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const snapshotMonth = `${snapshotDate.getFullYear()}-${String(snapshotDate.getMonth() + 1).padStart(2, '0')}`;
    
    const numContractsThisMonth = Math.max(1, Math.floor(Math.random() * (avgNewContractsPerMonth * 1.5 - avgNewContractsPerMonth * 0.5) + avgNewContractsPerMonth * 0.5));

    for (let i = 0; i < numContractsThisMonth; i++) {
      const assignedPersonnel = personnelList[Math.floor(Math.random() * personnelList.length)];
      const assignedSupplier = supplierList[Math.floor(Math.random() * supplierList.length)];
      const contractId = `CON-${snapshotMonth.replace('-', '')}-${String(contractCounter++).padStart(3, '0')}`;
      const contractBaseName = contractNames[Math.floor(Math.random() * contractNames.length)];
      
      // --- Dates ---
      // Contract Start Date: sometime in the snapshot month or previous month
      const contractStartDate = new Date(snapshotDate.getFullYear(), snapshotDate.getMonth() - Math.floor(Math.random() * 2), Math.floor(Math.random() * 28) + 1);

      // CO KPI: Target 4 months from start, actual varies
      const coKpiTargetCompletionDate = new Date(contractStartDate);
      coKpiTargetCompletionDate.setMonth(coKpiTargetCompletionDate.getMonth() + 4);
      let coKpiActualCompletionDate = null;
      if (Math.random() < (healthModifiers.coKpiOnTimePercent || 0.8)) { // 80% on time
        coKpiActualCompletionDate = new Date(coKpiTargetCompletionDate);
        coKpiActualCompletionDate.setDate(coKpiActualCompletionDate.getDate() - Math.floor(Math.random() * 30)); // Up to 30 days early
      } else if (Math.random() < 0.7) { // Some late, some not yet complete
        coKpiActualCompletionDate = new Date(coKpiTargetCompletionDate);
        coKpiActualCompletionDate.setDate(coKpiActualCompletionDate.getDate() + Math.floor(Math.random() * 45)); // Up to 45 days late
      } // else null (not completed yet)

      // Award Notice: Target 30 days from start
      const awardNoticeRequiredByDate = new Date(contractStartDate);
      awardNoticeRequiredByDate.setDate(awardNoticeRequiredByDate.getDate() + 30);
      let awardNoticePublishedDate = null;
      if (Math.random() < 0.9) awardNoticePublishedDate = new Date(awardNoticeRequiredByDate.setDate(awardNoticeRequiredByDate.getDate() - Math.floor(Math.random() * 10))); else if (Math.random() < 0.5) awardNoticePublishedDate = new Date(awardNoticeRequiredByDate.setDate(awardNoticeRequiredByDate.getDate() + Math.floor(Math.random() * 10)));
      
      // UK01 Notice: Target 30 days from start (can be same logic as award)
      const uk01NoticeRequiredByDate = new Date(contractStartDate);
      uk01NoticeRequiredByDate.setDate(uk01NoticeRequiredByDate.getDate() + 30);
      let uk01NoticePublishedDate = null;
      if (Math.random() < 0.85) uk01NoticePublishedDate = new Date(uk01NoticeRequiredByDate.setDate(uk01NoticeRequiredByDate.getDate() - Math.floor(Math.random() * 10))); else if (Math.random() < 0.5) uk01NoticePublishedDate = new Date(uk01NoticeRequiredByDate.setDate(uk01NoticeRequiredByDate.getDate() + Math.floor(Math.random() * 10)));

      // Budget & Spend
      const contractBudgetValue = Math.floor(Math.random() * 900000) + 100000; // 100k to 1M
      let contractActualSpend = contractBudgetValue * (Math.random() * 0.4 + 0.7); // 70% to 110% of budget
      if (Math.random() > (healthModifiers.overspendRateTarget || 0.95)) { // 5% chance of overspend > 10%
          contractActualSpend = contractBudgetValue * (Math.random() * 0.3 + 1.1); // 110% to 140%
      }
      contractActualSpend = parseFloat(contractActualSpend.toFixed(2));


      // Expiry & Closure
      const contractExpiryDate = new Date(contractStartDate);
      contractExpiryDate.setFullYear(contractExpiryDate.getFullYear() + (Math.floor(Math.random() * 3) + 1)); // 1-3 years duration
      const contractClosureTargetDate = new Date(contractExpiryDate);
      contractClosureTargetDate.setMonth(contractClosureTargetDate.getMonth() + 12);
      let contractActualClosureDate = null;
      if (contractExpiryDate < today && Math.random() < 0.7) { // 70% of expired contracts are closed
          if(Math.random() < 0.8) contractActualClosureDate = new Date(contractClosureTargetDate.setDate(contractClosureTargetDate.getDate() - Math.floor(Math.random() * 60)));
          else contractActualClosureDate = new Date(contractClosureTargetDate.setDate(contractClosureTargetDate.getDate() + Math.floor(Math.random() * 60)));
      }

      // Boolean Indicators
      const hasSocialValueCommitment = Math.random() < 0.9; // 90% have it
      const isSmeAwarded = Math.random() < 0.4; // 40% SME
      const wasCompetitivelyTendered = Math.random() < 0.95; // 95% competitive

      // Cabinet Office Conditions (e.g., 3 conditions)
      const cabinetOfficeConditionAMet = Math.random() < (healthModifiers.coConditionsMetPercent || 0.9);
      const cabinetOfficeConditionBMet = Math.random() < (healthModifiers.coConditionsMetPercent || 0.9);
      const cabinetOfficeConditionCMet = Math.random() < (healthModifiers.coConditionsMetPercent || 0.9);

      // Contract Status (derived or explicit)
      let contractStatus = "Active";
      if (contractActualClosureDate) contractStatus = "Closed";
      else if (contractExpiryDate < today) contractStatus = "Expired - Pending Closure";
      else if (coKpiActualCompletionDate && coKpiActualCompletionDate > coKpiTargetCompletionDate) contractStatus = "Active - KPI Overdue";


      contracts.push({
        // For CSV: one row per contract with all its raw data for that snapshot
        // For DB (contracts table): one row per metric per contract per snapshot
        // For this generator, we'll produce one complex object per contract per snapshot.
        // The ingest.py script will then transform this into multiple rows for the 'contracts' DB table.

        // Common fields for each "contract record" in the generated JSON
        supplier_id: assignedSupplier.supplier_id,
        contract_id: contractId,
        contract_name: `${contractBaseName} ${snapshotMonth.slice(0,4)}/${contractCounter % 100}`,
        personnel_id: assignedPersonnel.personnel_id,
        snapshot_month: snapshotMonth,
        contract_status: contractStatus,

        // Date fields
        contract_start_date: contractStartDate.toISOString().split('T')[0],
        co_kpi_target_completion_date: coKpiTargetCompletionDate.toISOString().split('T')[0],
        co_kpi_actual_completion_date: coKpiActualCompletionDate ? coKpiActualCompletionDate.toISOString().split('T')[0] : null,
        award_notice_required_by_date: awardNoticeRequiredByDate.toISOString().split('T')[0],
        award_notice_published_date: awardNoticePublishedDate ? awardNoticePublishedDate.toISOString().split('T')[0] : null,
        uk01_notice_required_by_date: uk01NoticeRequiredByDate.toISOString().split('T')[0],
        uk01_notice_published_date: uk01NoticePublishedDate ? uk01NoticePublishedDate.toISOString().split('T')[0] : null,
        contract_expiry_date: contractExpiryDate.toISOString().split('T')[0],
        contract_closure_target_date: contractClosureTargetDate.toISOString().split('T')[0],
        contract_actual_closure_date: contractActualClosureDate ? contractActualClosureDate.toISOString().split('T')[0] : null,

        // Numeric fields
        contract_budget_value: contractBudgetValue,
        contract_actual_spend: contractActualSpend,
        
        // Boolean fields
        has_social_value_commitment: hasSocialValueCommitment,
        is_sme_awarded: isSmeAwarded,
        was_competitively_tendered: wasCompetitivelyTendered,
        cabinet_office_condition_A_met: cabinetOfficeConditionAMet,
        cabinet_office_condition_B_met: cabinetOfficeConditionBMet,
        cabinet_office_condition_C_met: cabinetOfficeConditionCMet,
      });
    }
  }
  return contracts;
}

// --- NEW Helper Function: generateTrainingData ---
function generateTrainingData(personnelList, numMonthsToGenerate, healthModifiers = {}) {
  const trainingRecords = [];
  const today = new Date();
  const mandatoryTrainings = [
    { id: "TRN001", name: "Annual Security Awareness" },
    { id: "TRN002", name: "Data Protection Essentials (GDPR)" },
    { id: "TRN003", name: "Workplace Harassment Prevention" },
    { id: "TRN004", name: "Ethics & Compliance Fundamentals" },
  ];
  const trainingCompletionTarget = healthModifiers.trainingCompletionPercent || 0.85; // 85% target completion

  for (let m = 0; m < numMonthsToGenerate; m++) {
    const snapshotDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const snapshotMonth = `${snapshotDate.getFullYear()}-${String(snapshotDate.getMonth() + 1).padStart(2, '0')}`;

    personnelList.forEach(personnel => {
      mandatoryTrainings.forEach(trainingModule => {
        // Due date: e.g., end of the snapshot month, or a fixed date in the year
        const trainingDueDate = new Date(snapshotDate.getFullYear(), snapshotDate.getMonth() + 1, 0); // Last day of snapshot month

        let trainingStatus = "Not Started";
        let completionPercentage = 0;
        let trainingCompletionDate = null;

        const randomFactor = Math.random();
        if (randomFactor < trainingCompletionTarget) { // Meets target
          trainingStatus = "Completed";
          completionPercentage = 100;
          // Completed sometime before or during the snapshot month, but before due date
          const completionDay = Math.floor(Math.random() * trainingDueDate.getDate()) + 1;
          trainingCompletionDate = new Date(snapshotDate.getFullYear(), snapshotDate.getMonth(), completionDay);
          // Ensure completion date is not after due date for "Completed" status
          if (trainingCompletionDate > trainingDueDate) {
            trainingCompletionDate = new Date(trainingDueDate);
            trainingCompletionDate.setDate(trainingDueDate.getDate() - Math.floor(Math.random()*7)); // completed within last week
          }

        } else if (randomFactor < trainingCompletionTarget + 0.1) { // In Progress (10% chance after target)
          trainingStatus = "In Progress";
          completionPercentage = Math.floor(Math.random() * 70) + 20; // 20-89%
        } else { // Not Started or Overdue (remaining 5% or if target is low)
          if (snapshotDate > trainingDueDate && trainingStatus === "Not Started") { // Check if snapshot is past due date
            trainingStatus = "Overdue";
          } else {
            trainingStatus = "Not Started"; // Stays "Not Started" if not yet due or just slightly past
          }
        }
        // If snapshot is past due date and not completed, mark as overdue
        if (snapshotDate > trainingDueDate && trainingStatus !== "Completed"){
            trainingStatus = "Overdue";
        }


        trainingRecords.push({
          personnel_id: personnel.personnel_id,
          snapshot_month: snapshotMonth,
          training_module_id: trainingModule.id,
          training_module_name: trainingModule.name,
          training_status: trainingStatus,
          completion_percentage: completionPercentage,
          training_completion_date: trainingCompletionDate ? trainingCompletionDate.toISOString().split('T')[0] : null,
          training_due_date: trainingDueDate.toISOString().split('T')[0],
        });
      });
    });
  }
  return trainingRecords;
}

function generateSuppliers(numSuppliers = 50) {
  const suppliers = [];
  const companySuffixes = ["Corp", "Inc.", "Ltd.", "Solutions", "Group", "Tech", "Enterprises", "Global"];
  const firstWord = ["Apex", "Vertex", "Zenith", "Orion", "Cyber", "Nova", "Quantum", "Stellar", "Aegis", "Core", "Synergy", "Momentum"];
  const secondWord = ["Dynamics", "Systems", "Innovations", "Logistics", "Networks", "Technologies", "Consulting", "Secure", "Data", "Cloud"];
  
  const countries = ["USA", "UK", "Germany", "Canada", "France", "Japan", "Australia", "India", "China", "Brazil"];
  const citiesByCountry = {
    "USA": ["New York", "San Francisco", "Austin", "Chicago", "Seattle", "Los Angeles", "Boston", "Miami"],
    "UK": ["London", "Manchester", "Edinburgh", "Birmingham", "Bristol", "Liverpool", "Glasgow", "Leeds"],
    "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart", "Düsseldorf", "Dortmund"],
    "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton", "Quebec City", "Winnipeg"],
    "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Bordeaux"],
    "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo", "Fukuoka", "Kobe"],
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Hobart"],
    "India": ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad"],
    "China": ["Beijing", "Shanghai", "Shenzhen", "Guangzhou", "Hangzhou", "Chengdu", "Chongqing", "Tianjin"],
    "Brazil": ["Sao Paulo", "Rio de Janeiro", "Brasilia", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba"]
  };

  for (let i = 1; i <= numSuppliers; i++) {
    const name1 = firstWord[Math.floor(Math.random() * firstWord.length)];
    const name2 = secondWord[Math.floor(Math.random() * secondWord.length)];
    const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    
    const citiesForCountry = citiesByCountry[country] || []; 
    const city = citiesForCountry.length > 0 ? citiesForCountry[Math.floor(Math.random() * citiesForCountry.length)] : "Unknown City";
    
    // ***** DEFINE supplierIdNum HERE, BEFORE IT'S USED *****
    const supplierIdNumPart = String(i).padStart(4, '0'); 
    // *******************************************************

    suppliers.push({
      supplier_id: `SUP${supplierIdNumPart}`, // Use it here
      supplier_name: `${name1} ${name2} ${suffix}`,
      country: country,
      city: city,
      contact_email: `${name1.toLowerCase()}${name2.toLowerCase()}${supplierIdNumPart}@example-supplier.com`, // And use it here
      rating: parseFloat((Math.random() * 4 + 1).toFixed(1))
    });
  }
  return suppliers;
}


// --- Main Service Function ---
export function generateAllFictionalData(params) {
  const {
    numTeams = 5,
    avgSubTeamsPerTeam = 3,
    avgPersonnelPerSubTeam = 20,
    numSuppliers = 50,
    numMonthsToGenerate = 12,
    avgNewContractsPerMonth = 10,
    kpiHealth = { 
        coKpiOnTimePercent: 0.8, 
        overspendRateTarget: 0.95, 
        coConditionsMetPercent: 0.9,
        trainingCompletionPercent: 0.85
    }
  } = params;

  const teams = generateTeams(numTeams);
  const subTeams = generateSubTeams(teams, avgSubTeamsPerTeam);
  const personnel = generatePersonnel(subTeams, avgPersonnelPerSubTeam);
  const suppliers = generateSuppliers(numSuppliers);
  const contractData = generateContractData(personnel, suppliers, numMonthsToGenerate, avgNewContractsPerMonth, kpiHealth);
  const trainingData = generateTrainingData(personnel, numMonthsToGenerate, kpiHealth);

  return {
    teams,
    subTeams,
    personnel,
    suppliers,
    contractData,
    trainingData,
  };
}