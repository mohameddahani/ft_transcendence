/*
  Warnings:

  - You are about to drop the column `date` on the `special_hours` table. All the data in the column will be lost.
  - Added the required column `end_date` to the `special_hours` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `special_hours` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "special_hours_admin_id_date_idx";

-- AlterTable
ALTER TABLE "special_hours" DROP COLUMN "date",
ADD COLUMN     "end_date" DATE NOT NULL,
ADD COLUMN     "start_date" DATE NOT NULL;

-- CreateIndex
CREATE INDEX "special_hours_admin_id_start_date_end_date_idx" ON "special_hours"("admin_id", "start_date", "end_date");
