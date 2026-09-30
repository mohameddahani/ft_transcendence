/*
  Warnings:

  - Made the column `weekly_visit_limit` on table `membership_plans` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "membership_plans" ALTER COLUMN "weekly_visit_limit" SET NOT NULL;
