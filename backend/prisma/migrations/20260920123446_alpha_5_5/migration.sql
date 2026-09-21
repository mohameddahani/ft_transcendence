/*
  Warnings:

  - A unique constraint covering the columns `[admin_id,day_of_week]` on the table `working_hours` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "working_hours_admin_id_day_of_week_start_time_key";

-- CreateIndex
CREATE UNIQUE INDEX "working_hours_admin_id_day_of_week_key" ON "working_hours"("admin_id", "day_of_week");
