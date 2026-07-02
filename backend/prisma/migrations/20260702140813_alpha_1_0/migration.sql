/*
  Warnings:

  - You are about to drop the column `note` on the `payments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "membershipPlanDurations" DROP CONSTRAINT "membershipPlanDurations_membershipPlanId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_adminId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_memberId_fkey";

-- DropForeignKey
ALTER TABLE "planDurations" DROP CONSTRAINT "planDurations_planId_fkey";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "note";

-- AddForeignKey
ALTER TABLE "planDurations" ADD CONSTRAINT "planDurations_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membershipPlanDurations" ADD CONSTRAINT "membershipPlanDurations_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "membershipPlans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
