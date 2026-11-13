/*
  Warnings:

  - The `account_status` column on the `members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `account_status` column on the `staffs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `account_status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PENDING', 'BANNED');

-- AlterTable
ALTER TABLE "members" DROP COLUMN "account_status",
ADD COLUMN     "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "staffs" DROP COLUMN "account_status",
ADD COLUMN     "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "account_status",
ADD COLUMN     "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "MemberAccountStatus";

-- DropEnum
DROP TYPE "UserAccountStatus";
