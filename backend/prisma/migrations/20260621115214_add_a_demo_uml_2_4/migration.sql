/*
  Warnings:

  - You are about to drop the column `endDate` on the `members` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "members" DROP COLUMN "endDate",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;
