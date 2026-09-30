/*
  Warnings:

  - The `start_time` column on the `special_hours` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `end_time` column on the `special_hours` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `start_time` on the `working_hours` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `end_time` on the `working_hours` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "special_hours" DROP COLUMN "start_time",
ADD COLUMN     "start_time" TIME,
DROP COLUMN "end_time",
ADD COLUMN     "end_time" TIME;

-- AlterTable
ALTER TABLE "working_hours" DROP COLUMN "start_time",
ADD COLUMN     "start_time" TIME NOT NULL,
DROP COLUMN "end_time",
ADD COLUMN     "end_time" TIME NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "working_hours_admin_id_day_of_week_start_time_key" ON "working_hours"("admin_id", "day_of_week", "start_time");
