-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'inactive', 'pending', 'banned');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accountStatus" "AccountStatus" NOT NULL DEFAULT 'inactive';
