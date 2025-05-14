-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "supplier_id" TEXT;

-- CreateTable
CREATE TABLE "suppliers" (
    "supplier_id" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "contact_email" TEXT,
    "rating" DOUBLE PRECISION,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_contact_email_key" ON "suppliers"("contact_email");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE SET NULL ON UPDATE CASCADE;
