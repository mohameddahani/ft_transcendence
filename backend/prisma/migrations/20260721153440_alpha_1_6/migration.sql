/*
  Warnings:

  - You are about to drop the column `jwtId` on the `MemberRefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `jwtId` on the `UserRefreshToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jti]` on the table `MemberRefreshToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jti]` on the table `UserRefreshToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jti` to the `MemberRefreshToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jti` to the `UserRefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "MemberRefreshToken_jwtId_key";

-- DropIndex
DROP INDEX "UserRefreshToken_jwtId_key";

-- AlterTable
ALTER TABLE "MemberRefreshToken" DROP COLUMN "jwtId",
ADD COLUMN     "jti" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserRefreshToken" DROP COLUMN "jwtId",
ADD COLUMN     "jti" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MemberRefreshToken_jti_key" ON "MemberRefreshToken"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "UserRefreshToken_jti_key" ON "UserRefreshToken"("jti");
