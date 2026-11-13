/*
  Warnings:

  - You are about to drop the column `status` on the `members` table. All the data in the column will be lost.
  - The `accountStatus` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'BANNED');

-- CreateEnum
CREATE TYPE "MemberAccountStatus" AS ENUM ('ACTIVE', 'FROZEN', 'BANNED');

-- AlterTable
ALTER TABLE "members" DROP COLUMN "status",
ADD COLUMN     "accountStatus" "MemberAccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "accountStatus",
ADD COLUMN     "accountStatus" "UserAccountStatus" NOT NULL DEFAULT 'INACTIVE';

-- DropEnum
DROP TYPE "AccountStatus";

-- DropEnum
DROP TYPE "MemberStatus";
