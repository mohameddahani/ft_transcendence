-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('QR_CODE', 'MANUAL');

-- AlterTable
ALTER TABLE "membership_plans" ADD COLUMN     "weekly_visit_limit" INTEGER;

-- AlterTable
ALTER TABLE "staffs" ALTER COLUMN "account_status" SET DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "membership_plan_id" TEXT NOT NULL,
    "staffId" TEXT,
    "attendance_method" "AttendanceMethod" NOT NULL,
    "checked_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_out_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendances_admin_id_checked_in_at_idx" ON "attendances"("admin_id", "checked_in_at");

-- CreateIndex
CREATE INDEX "attendances_member_id_checked_in_at_idx" ON "attendances"("member_id", "checked_in_at");

-- CreateIndex
CREATE INDEX "attendances_membership_plan_id_checked_in_at_idx" ON "attendances"("membership_plan_id", "checked_in_at");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_membership_plan_id_fkey" FOREIGN KEY ("membership_plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
