-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'MANAGER_APPROVED', 'ADMIN_APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('TRANSPORT', 'ACCOMMODATION', 'MEALS', 'ENTERTAINMENT', 'EQUIPMENT', 'SOFTWARE', 'TRAINING', 'COMMUNICATION', 'MEDICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "MeetingRoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('CORPORATE_SECRETARY', 'LAW_FIRM', 'ACCOUNTING_FIRM', 'BANK', 'INSURANCE', 'TRANSLATION', 'LOGISTICS', 'IT_SERVICE', 'OTHER');

-- AlterTable: customers (add profile enhancement fields)
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "birthday" DATE;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "occupation" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "profile_notes" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: documents (add soft delete)
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "documents_deleted_at_idx" ON "documents"("deleted_at");

-- AlterTable: users (add 2FA fields)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_secret" TEXT;

-- CreateTable: webhook_endpoints
CREATE TABLE IF NOT EXISTS "webhook_endpoints" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable: webhook_logs
CREATE TABLE IF NOT EXISTS "webhook_logs" (
    "id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status_code" INTEGER,
    "response" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: meeting_rooms
CREATE TABLE IF NOT EXISTS "meeting_rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "status" "MeetingRoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "equipment" TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meeting_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable: meeting_minutes
CREATE TABLE IF NOT EXISTS "meeting_minutes" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attendees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "action_items" JSONB,
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meeting_minutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable: claims
CREATE TABLE IF NOT EXISTS "claims" (
    "id" TEXT NOT NULL,
    "claim_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "total_amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SGD',
    "submitter_id" TEXT NOT NULL,
    "project_id" TEXT,
    "manager_approved_by_id" TEXT,
    "manager_approved_at" TIMESTAMP(3),
    "manager_comment" TEXT,
    "admin_approved_by_id" TEXT,
    "admin_approved_at" TIMESTAMP(3),
    "admin_comment" TEXT,
    "rejected_by_id" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "paid_at" TIMESTAMP(3),
    "payment_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable: claim_items
CREATE TABLE IF NOT EXISTS "claim_items" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "receipt_url" TEXT,
    "receipt_name" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "claim_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: expense_category_configs
CREATE TABLE IF NOT EXISTS "expense_category_configs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "daily_limit" DECIMAL(15,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expense_category_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: vendors
CREATE TABLE IF NOT EXISTS "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VendorType" NOT NULL DEFAULT 'OTHER',
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "registration_no" TEXT,
    "tax_id" TEXT,
    "service_scope" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rating" INTEGER DEFAULT 0,
    "contract_start" TIMESTAMP(3),
    "contract_end" TIMESTAMP(3),
    "contract_terms" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable: vendor_assignments
CREATE TABLE IF NOT EXISTS "vendor_assignments" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "fee" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'SGD',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "webhook_endpoints_is_active_idx" ON "webhook_endpoints"("is_active");
CREATE INDEX IF NOT EXISTS "webhook_logs_endpoint_id_idx" ON "webhook_logs"("endpoint_id");
CREATE INDEX IF NOT EXISTS "webhook_logs_created_at_idx" ON "webhook_logs"("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_minutes_appointment_id_key" ON "meeting_minutes"("appointment_id");
CREATE UNIQUE INDEX IF NOT EXISTS "claims_claim_number_key" ON "claims"("claim_number");
CREATE INDEX IF NOT EXISTS "claims_submitter_id_idx" ON "claims"("submitter_id");
CREATE INDEX IF NOT EXISTS "claims_status_idx" ON "claims"("status");
CREATE INDEX IF NOT EXISTS "claims_deleted_at_idx" ON "claims"("deleted_at");
CREATE INDEX IF NOT EXISTS "claim_items_claim_id_idx" ON "claim_items"("claim_id");
CREATE UNIQUE INDEX IF NOT EXISTS "expense_category_configs_code_key" ON "expense_category_configs"("code");
CREATE INDEX IF NOT EXISTS "vendors_type_idx" ON "vendors"("type");
CREATE INDEX IF NOT EXISTS "vendors_status_idx" ON "vendors"("status");
CREATE INDEX IF NOT EXISTS "vendors_deleted_at_idx" ON "vendors"("deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "vendor_assignments_vendor_id_project_id_role_key" ON "vendor_assignments"("vendor_id", "project_id", "role");
CREATE INDEX IF NOT EXISTS "vendor_assignments_vendor_id_idx" ON "vendor_assignments"("vendor_id");
CREATE INDEX IF NOT EXISTS "vendor_assignments_project_id_idx" ON "vendor_assignments"("project_id");

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_minutes" ADD CONSTRAINT "meeting_minutes_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_minutes" ADD CONSTRAINT "meeting_minutes_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "claims" ADD CONSTRAINT "claims_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "claims" ADD CONSTRAINT "claims_manager_approved_by_id_fkey" FOREIGN KEY ("manager_approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "claims" ADD CONSTRAINT "claims_admin_approved_by_id_fkey" FOREIGN KEY ("admin_approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "claims" ADD CONSTRAINT "claims_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "claim_items" ADD CONSTRAINT "claim_items_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_assignments" ADD CONSTRAINT "vendor_assignments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
