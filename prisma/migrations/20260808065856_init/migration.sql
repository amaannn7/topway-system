-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "WorkerCategory" AS ENUM ('AVAILABLE_EXPERIENCED', 'AVAILABLE_INEXPERIENCED', 'CONTRACTED');

-- CreateEnum
CREATE TYPE "ExperienceType" AS ENUM ('HM_21_49_EXP', 'HM_50_55_EXP', 'HM_51_55_EXP', 'HM_FIRST_TIME', 'COUPLE', 'DRIVER', 'HOUSE_BOY');

-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('ACTIVE', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PipelineStepKey" AS ENUM ('MEDICAL', 'ENJAZ', 'BUREAU', 'WAKALAH', 'EMBASSY', 'PAYMENT');

-- CreateEnum
CREATE TYPE "PhotoKind" AS ENUM ('HEADSHOT', 'FULL_BODY');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('PASSPORT', 'ALTERATION_PAGE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('KD', 'USD', 'SAR', 'AED', 'QAR', 'BHD', 'OMR', 'EUR');

-- CreateEnum
CREATE TYPE "AdvanceStatus" AS ENUM ('NONE', 'REQUESTED', 'PAID');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'STAFF',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "adminUserId" TEXT,
    "agentId" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_assignments" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_requests" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "agent_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" TEXT NOT NULL,
    "refNo" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'HOUSEMAID',
    "contract" TEXT NOT NULL DEFAULT '2 YEARS',
    "nationality" TEXT,
    "religion" TEXT,
    "dateOfBirth" DATE,
    "age" INTEGER,
    "heightCm" INTEGER,
    "weightKg" INTEGER,
    "maritalStatus" "MaritalStatus",
    "children" INTEGER,
    "passportNo" TEXT,
    "passportIssuedAt" TEXT,
    "passportIssueDate" DATE,
    "passportExpiryDate" DATE,
    "educationLevel" TEXT,
    "educationYear" INTEGER,
    "skillCleaning" BOOLEAN NOT NULL DEFAULT false,
    "skillWashing" BOOLEAN NOT NULL DEFAULT false,
    "skillBabysitting" BOOLEAN NOT NULL DEFAULT false,
    "skillCooking" BOOLEAN NOT NULL DEFAULT false,
    "skillDriving" BOOLEAN NOT NULL DEFAULT false,
    "englishSpeaking" BOOLEAN NOT NULL DEFAULT false,
    "englishWriting" BOOLEAN NOT NULL DEFAULT false,
    "arabicSpeaking" BOOLEAN NOT NULL DEFAULT false,
    "arabicWriting" BOOLEAN NOT NULL DEFAULT false,
    "footerLine1" TEXT,
    "footerLine2" TEXT,
    "footerLine3" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "emergencyContact" TEXT,
    "address" TEXT,
    "pipelineStatus" "PipelineStatus" NOT NULL DEFAULT 'ACTIVE',
    "workerCategory" "WorkerCategory",
    "experienceType" "ExperienceType",
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "musanedDate" DATE,
    "ticketDate" DATE,
    "saudiAgentVisaDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_records" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "employment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_steps" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "key" "PipelineStepKey" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATE,

    CONSTRAINT "pipeline_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_photos" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "kind" "PhotoKind" NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applicant_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_documents" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applicant_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "invoicedDate" DATE NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'KD',
    "agentId" TEXT,
    "billToTitle" TEXT NOT NULL,
    "billToCompany" TEXT NOT NULL,
    "billToPurpose" TEXT NOT NULL,
    "billToLicenseNo" TEXT,
    "serviceType" TEXT NOT NULL DEFAULT 'HOUSEMAID WORKERS',
    "advanceStatus" "AdvanceStatus" NOT NULL DEFAULT 'NONE',
    "advanceAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "swiftCode" TEXT NOT NULL,
    "notes" TEXT,
    "footerEmail" TEXT NOT NULL,
    "footerPhone" TEXT NOT NULL,
    "footerFax" TEXT NOT NULL,
    "footerAddress" TEXT NOT NULL,
    "footerWebsite" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_workers" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "applicantId" TEXT,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(12,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "headerLogoUrl" TEXT,
    "allowAgentBrowse" BOOLEAN NOT NULL DEFAULT false,
    "defaultFooterLine1" TEXT,
    "defaultFooterLine2" TEXT,
    "defaultFooterLine3" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "agents_username_key" ON "agents"("username");

-- CreateIndex
CREATE UNIQUE INDEX "agent_assignments_agentId_applicantId_key" ON "agent_assignments"("agentId", "applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_requests_agentId_applicantId_key" ON "agent_requests"("agentId", "applicantId");

-- CreateIndex
CREATE INDEX "applicants_name_idx" ON "applicants"("name");

-- CreateIndex
CREATE INDEX "applicants_pipelineStatus_idx" ON "applicants"("pipelineStatus");

-- CreateIndex
CREATE INDEX "applicants_workerCategory_idx" ON "applicants"("workerCategory");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_steps_applicantId_key_key" ON "pipeline_steps"("applicantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "applicant_photos_applicantId_kind_key" ON "applicant_photos"("applicantId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "applicant_documents_applicantId_kind_key" ON "applicant_documents"("applicantId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNo_key" ON "invoices"("invoiceNo");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_requests" ADD CONSTRAINT "agent_requests_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_requests" ADD CONSTRAINT "agent_requests_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_records" ADD CONSTRAINT "employment_records_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_steps" ADD CONSTRAINT "pipeline_steps_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_photos" ADD CONSTRAINT "applicant_photos_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_documents" ADD CONSTRAINT "applicant_documents_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_workers" ADD CONSTRAINT "invoice_workers_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_workers" ADD CONSTRAINT "invoice_workers_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
