-- AlterTable
ALTER TABLE "members" ADD COLUMN     "admin_wallet_address" TEXT;

-- AlterTable
ALTER TABLE "membership_plan_durations" ADD COLUMN     "price_by_g" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "wallet_address" TEXT;
