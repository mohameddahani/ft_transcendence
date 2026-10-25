/*
  Warnings:

  - Made the column `price_by_g` on table `membership_plan_durations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "membership_plan_durations" ALTER COLUMN "price_by_g" SET NOT NULL;
