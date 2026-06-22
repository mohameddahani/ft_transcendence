/*
  Warnings:

  - You are about to drop the column `paidAmount` on the `payments` table. All the data in the column will be lost.
  - Made the column `dueDate` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "paidAmount",
ALTER COLUMN "dueDate" SET NOT NULL;
