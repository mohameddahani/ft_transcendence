/*
  Warnings:

  - You are about to drop the column `durationDays` on the `membershipPlans` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `membershipPlans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "membershipPlans" DROP COLUMN "durationDays",
DROP COLUMN "price";

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "description" TEXT;
