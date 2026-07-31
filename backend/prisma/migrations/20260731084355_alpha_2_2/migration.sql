/*
  Warnings:

  - You are about to drop the column `photo` on the `members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "members" DROP COLUMN "photo",
ADD COLUMN     "profileImage" TEXT NOT NULL DEFAULT 'default-member-image.jpg';
