/*
  Warnings:

  - Made the column `qr_token_hash` on table `visits` required. This step will fail if there are existing NULL values in that column.
  - Made the column `qr_expires_at` on table `visits` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "visits" ALTER COLUMN "qr_token_hash" SET NOT NULL,
ALTER COLUMN "qr_expires_at" SET NOT NULL;
