/*
  Warnings:

  - A unique constraint covering the columns `[jwtId]` on the table `MemberRefreshToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jwtId]` on the table `UserRefreshToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jwtId` to the `MemberRefreshToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jwtId` to the `UserRefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MemberRefreshToken" ADD COLUMN     "jwtId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserRefreshToken" ADD COLUMN     "jwtId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MemberRefreshToken_jwtId_key" ON "MemberRefreshToken"("jwtId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRefreshToken_jwtId_key" ON "UserRefreshToken"("jwtId");
