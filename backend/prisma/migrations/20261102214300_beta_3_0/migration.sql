/*
  Warnings:

  - A unique constraint covering the columns `[membership_plan_id,duration_days,price]` on the table `membership_plan_durations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[admin_id,plan_name]` on the table `membership_plans` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[plan_id,duration_days,price]` on the table `plan_durations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "membership_plans_admin_id_plan_name_idx";

-- CreateIndex
CREATE UNIQUE INDEX "membership_plan_durations_membership_plan_id_duration_days__key" ON "membership_plan_durations"("membership_plan_id", "duration_days", "price");

-- CreateIndex
CREATE UNIQUE INDEX "membership_plans_admin_id_plan_name_key" ON "membership_plans"("admin_id", "plan_name");

-- CreateIndex
CREATE UNIQUE INDEX "plan_durations_plan_id_duration_days_price_key" ON "plan_durations"("plan_id", "duration_days", "price");
