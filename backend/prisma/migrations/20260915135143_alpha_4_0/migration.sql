/*
  Warnings:

  - You are about to drop the column `status` on the `attendances` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "status",
ADD COLUMN     "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'READY';
