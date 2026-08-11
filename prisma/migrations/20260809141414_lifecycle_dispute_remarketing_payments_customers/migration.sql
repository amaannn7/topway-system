-- CreateEnum
CREATE TYPE "DisputeCategory" AS ENUM ('RUNAWAY', 'REFUSAL_TO_WORK', 'MEDICALLY_UNFIT', 'OTHER');

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "canViewPayments" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "applicants" ADD COLUMN     "departureDate" DATE,
ADD COLUMN     "destinationCountry" TEXT;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_shares" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "category" "DisputeCategory" NOT NULL,
    "notes" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remarketing_records" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "previousAgentId" TEXT,
    "disputeId" TEXT,
    "remarketedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdById" TEXT,

    CONSTRAINT "remarketing_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_username_key" ON "customers"("username");

-- CreateIndex
CREATE UNIQUE INDEX "customer_shares_customerId_applicantId_key" ON "customer_shares"("customerId", "applicantId");

-- CreateIndex
CREATE INDEX "disputes_applicantId_idx" ON "disputes"("applicantId");

-- CreateIndex
CREATE INDEX "remarketing_records_applicantId_idx" ON "remarketing_records"("applicantId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_shares" ADD CONSTRAINT "customer_shares_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_shares" ADD CONSTRAINT "customer_shares_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remarketing_records" ADD CONSTRAINT "remarketing_records_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remarketing_records" ADD CONSTRAINT "remarketing_records_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remarketing_records" ADD CONSTRAINT "remarketing_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
