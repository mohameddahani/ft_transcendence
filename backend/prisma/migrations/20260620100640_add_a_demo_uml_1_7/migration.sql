/*
  Warnings:

  - You are about to drop the column `duration` on the `membershipPlans` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `subscriptions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[planName]` on the table `membershipPlans` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[planName]` on the table `plans` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `durationDays` to the `membershipPlans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planName` to the `membershipPlans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planName` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_name_fkey";

-- DropIndex
DROP INDEX "plans_name_key";

-- DropIndex
DROP INDEX "subscriptions_name_key";

-- AlterTable
ALTER TABLE "membershipPlans" DROP COLUMN "duration",
ADD COLUMN     "durationDays" INTEGER NOT NULL,
ADD COLUMN     "planName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "name",
ADD COLUMN     "planName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "name";

-- DropEnum
DROP TYPE "MembershipDuration";

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "members_phoneNumber_key" ON "members"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "membershipPlans_planName_key" ON "membershipPlans"("planName");

-- CreateIndex
CREATE UNIQUE INDEX "plans_planName_key" ON "plans"("planName");
