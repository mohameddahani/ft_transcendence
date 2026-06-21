/*
  Warnings:

  - You are about to drop the column `membershipId` on the `members` table. All the data in the column will be lost.
  - Added the required column `membershipPlanDurationId` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `membershipPlanId` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planDurationId` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_membershipId_fkey";

-- DropIndex
DROP INDEX "members_email_key";

-- DropIndex
DROP INDEX "members_phoneNumber_key";

-- DropIndex
DROP INDEX "membershipPlans_planName_key";

-- AlterTable
ALTER TABLE "members" DROP COLUMN "membershipId",
ADD COLUMN     "membershipPlanDurationId" TEXT NOT NULL,
ADD COLUMN     "membershipPlanId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "planDurationId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planDurationId_fkey" FOREIGN KEY ("planDurationId") REFERENCES "planDurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "membershipPlans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_membershipPlanDurationId_fkey" FOREIGN KEY ("membershipPlanDurationId") REFERENCES "membershipPlanDurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
