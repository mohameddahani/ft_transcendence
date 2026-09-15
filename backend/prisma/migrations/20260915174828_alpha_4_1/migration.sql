/*
  Warnings:

  - You are about to drop the column `attendanceStatus` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `checked_out_at` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `qr_expires_at` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `qr_token_hash` on the `attendances` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[visit_id]` on the table `attendances` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `visit_id` to the `attendances` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('READY', 'CHECKED_IN', 'CANCELLED', 'EXPIRED');

-- DropIndex
DROP INDEX "attendances_admin_id_member_id_checked_in_at_idx";

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "attendanceStatus",
DROP COLUMN "checked_out_at",
DROP COLUMN "expires_at",
DROP COLUMN "qr_expires_at",
DROP COLUMN "qr_token_hash",
ADD COLUMN     "visit_id" TEXT NOT NULL;

-- DropEnum
DROP TYPE "AttendanceStatus";

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "visit_status" "VisitStatus" NOT NULL DEFAULT 'READY',
    "qr_token_hash" TEXT,
    "qr_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visits_admin_id_visit_date_idx" ON "visits"("admin_id", "visit_date");

-- CreateIndex
CREATE INDEX "visits_member_id_visit_date_idx" ON "visits"("member_id", "visit_date");

-- CreateIndex
CREATE INDEX "visits_admin_id_visit_status_visit_date_idx" ON "visits"("admin_id", "visit_status", "visit_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_visit_id_key" ON "attendances"("visit_id");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
