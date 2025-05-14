-- CreateTable
CREATE TABLE "users" (
    "userId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personnel_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "teams" (
    "team_id" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("team_id")
);

-- CreateTable
CREATE TABLE "sub_teams" (
    "sub_team_id" TEXT NOT NULL,
    "sub_team_name" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,

    CONSTRAINT "sub_teams_pkey" PRIMARY KEY ("sub_team_id")
);

-- CreateTable
CREATE TABLE "personnel" (
    "personnel_id" TEXT NOT NULL,
    "personnel_name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "sub_team_id" TEXT,

    CONSTRAINT "personnel_pkey" PRIMARY KEY ("personnel_id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "contract_pk" SERIAL NOT NULL,
    "contract_id" TEXT NOT NULL,
    "snapshot_month" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "target_value" DOUBLE PRECISION,
    "value_type" TEXT,
    "date_associated" DATE,
    "personnel_id" TEXT,
    "co_kpi_target_completion_date" DATE,
    "co_kpi_actual_completion_date" DATE,
    "award_notice_required_by_date" DATE,
    "award_notice_published_date" DATE,
    "uk01_notice_required_by_date" DATE,
    "uk01_notice_published_date" DATE,
    "contract_budget_value" DECIMAL(15,2),
    "contract_actual_spend" DECIMAL(15,2),
    "contract_expiry_date" DATE,
    "contract_closure_target_date" DATE,
    "contract_actual_closure_date" DATE,
    "has_social_value_commitment" BOOLEAN,
    "is_sme_awarded" BOOLEAN,
    "was_competitively_tendered" BOOLEAN,
    "cabinet_office_condition_a_met" BOOLEAN,
    "cabinet_office_condition_b_met" BOOLEAN,
    "cabinet_office_condition_c_met" BOOLEAN,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("contract_pk")
);

-- CreateTable
CREATE TABLE "training_data" (
    "training_id" SERIAL NOT NULL,
    "personnel_id" TEXT NOT NULL,
    "snapshot_month" TEXT NOT NULL,
    "training_module_id" TEXT,
    "training_module_name" TEXT,
    "training_status" TEXT,
    "completion_percentage" INTEGER,
    "training_completion_date" DATE,
    "training_due_date" DATE,

    CONSTRAINT "training_data_pkey" PRIMARY KEY ("training_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_personnel_id_key" ON "users"("personnel_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_team_name_key" ON "teams"("team_name");

-- CreateIndex
CREATE UNIQUE INDEX "sub_teams_team_id_sub_team_name_key" ON "sub_teams"("team_id", "sub_team_name");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_email_key" ON "personnel"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_id_snapshot_month_metric_name_key" ON "contracts"("contract_id", "snapshot_month", "metric_name");

-- CreateIndex
CREATE UNIQUE INDEX "training_data_personnel_id_snapshot_month_training_module_i_key" ON "training_data"("personnel_id", "snapshot_month", "training_module_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnel"("personnel_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_teams" ADD CONSTRAINT "sub_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_sub_team_id_fkey" FOREIGN KEY ("sub_team_id") REFERENCES "sub_teams"("sub_team_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnel"("personnel_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_data" ADD CONSTRAINT "training_data_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnel"("personnel_id") ON DELETE CASCADE ON UPDATE CASCADE;
