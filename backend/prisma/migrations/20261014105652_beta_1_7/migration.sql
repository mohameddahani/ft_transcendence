/*
  Warnings:

  - You are about to drop the column `admin_wallet_address` on the `members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "members" DROP COLUMN "admin_wallet_address";
