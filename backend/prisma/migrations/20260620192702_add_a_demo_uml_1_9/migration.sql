/*
  Warnings:

  - You are about to drop the column `durationDays` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "plans" DROP COLUMN "durationDays",
DROP COLUMN "price";

-- CreateTable
CREATE TABLE "PlanDuration" (
    "id" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanDuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipPlanDuration" (
    "id" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "membershipPlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlanDuration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlanDuration" ADD CONSTRAINT "PlanDuration_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipPlanDuration" ADD CONSTRAINT "MembershipPlanDuration_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "membershipPlans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
