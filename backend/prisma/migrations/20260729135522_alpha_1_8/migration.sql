-- CreateEnum
CREATE TYPE "UserActionTokenType" AS ENUM ('EMAIL_VERIFICATION', 'RESET_PASSWORD', 'SET_PASSWORD');

-- CreateTable
CREATE TABLE "UserActionToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" "UserActionTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserActionToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberActionToken" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" "UserActionTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberActionToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserActionToken_tokenHash_key" ON "UserActionToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "MemberActionToken_tokenHash_key" ON "MemberActionToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "UserActionToken" ADD CONSTRAINT "UserActionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberActionToken" ADD CONSTRAINT "MemberActionToken_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
