/*
  Warnings:

  - You are about to drop the column `visit_date` on the `visits` table. All the data in the column will be lost.
  - Added the required column `visit_date_and_time` to the `visits` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "visits_admin_id_member_id_visit_date_idx";

-- DropIndex
DROP INDEX "visits_admin_id_member_id_visit_date_visit_status_idx";

-- DropIndex
DROP INDEX "visits_admin_id_visit_date_idx";

-- DropIndex
DROP INDEX "visits_admin_id_visit_status_visit_date_idx";

-- DropIndex
DROP INDEX "visits_member_id_visit_date_idx";

-- AlterTable
ALTER TABLE "visits" DROP COLUMN "visit_date",
ADD COLUMN     "visit_date_and_time" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "visits_admin_id_visit_date_and_time_idx" ON "visits"("admin_id", "visit_date_and_time");

-- CreateIndex
CREATE INDEX "visits_member_id_visit_date_and_time_idx" ON "visits"("member_id", "visit_date_and_time");

-- CreateIndex
CREATE INDEX "visits_admin_id_visit_status_visit_date_and_time_idx" ON "visits"("admin_id", "visit_status", "visit_date_and_time");

-- CreateIndex
CREATE INDEX "visits_admin_id_member_id_visit_date_and_time_idx" ON "visits"("admin_id", "member_id", "visit_date_and_time");

-- CreateIndex
CREATE INDEX "visits_admin_id_member_id_visit_date_and_time_visit_status_idx" ON "visits"("admin_id", "member_id", "visit_date_and_time", "visit_status");
