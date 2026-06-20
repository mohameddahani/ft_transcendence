/*
  Warnings:

  - You are about to drop the `MembershipPlanDuration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlanDuration` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MembershipPlanDuration" DROP CONSTRAINT "MembershipPlanDuration_membershipPlanId_fkey";

-- DropForeignKey
ALTER TABLE "PlanDuration" DROP CONSTRAINT "PlanDuration_planId_fkey";

-- DropTable
DROP TABLE "MembershipPlanDuration";

-- DropTable
DROP TABLE "PlanDuration";

-- CreateTable
CREATE TABLE "planDurations" (
    "id" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planDurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membershipPlanDurations" (
    "id" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "membershipPlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membershipPlanDurations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "planDurations" ADD CONSTRAINT "planDurations_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membershipPlanDurations" ADD CONSTRAINT "membershipPlanDurations_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "membershipPlans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
