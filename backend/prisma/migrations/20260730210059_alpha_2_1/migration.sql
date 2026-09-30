/*
  Warnings:

  - You are about to drop the `MemberActionToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MemberRefreshToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserActionToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRefreshToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MemberActionToken" DROP CONSTRAINT "MemberActionToken_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MemberRefreshToken" DROP CONSTRAINT "MemberRefreshToken_memberId_fkey";

-- DropForeignKey
ALTER TABLE "UserActionToken" DROP CONSTRAINT "UserActionToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserRefreshToken" DROP CONSTRAINT "UserRefreshToken_userId_fkey";

-- DropTable
DROP TABLE "MemberActionToken";

-- DropTable
DROP TABLE "MemberRefreshToken";

-- DropTable
DROP TABLE "UserActionToken";

-- DropTable
DROP TABLE "UserRefreshToken";

-- CreateTable
CREATE TABLE "userRefreshTokens" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "userRefreshTokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberRefreshTokens" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberRefreshTokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userActionTokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" "ActionTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "userActionTokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberActionTokens" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" "ActionTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberActionTokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "userRefreshTokens_jti_key" ON "userRefreshTokens"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "memberRefreshTokens_jti_key" ON "memberRefreshTokens"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "userActionTokens_tokenHash_key" ON "userActionTokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "memberActionTokens_tokenHash_key" ON "memberActionTokens"("tokenHash");

-- AddForeignKey
ALTER TABLE "userRefreshTokens" ADD CONSTRAINT "userRefreshTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberRefreshTokens" ADD CONSTRAINT "memberRefreshTokens_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userActionTokens" ADD CONSTRAINT "userActionTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberActionTokens" ADD CONSTRAINT "memberActionTokens_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
