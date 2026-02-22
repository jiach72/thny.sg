-- AlterTable: 添加客户画像增强字段
ALTER TABLE "customers" ADD COLUMN "birthday" DATE;
ALTER TABLE "customers" ADD COLUMN "occupation" TEXT;
ALTER TABLE "customers" ADD COLUMN "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "customers" ADD COLUMN "profile_notes" TEXT;
