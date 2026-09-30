/*
  Warnings:

  - Added the required column `qr_expires_at` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qr_token_hash` to the `attendances` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('READY', 'CHECKED_IN', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "qr_expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "qr_token_hash" TEXT NOT NULL,
ADD COLUMN     "status" "AttendanceStatus" NOT NULL DEFAULT 'READY';
