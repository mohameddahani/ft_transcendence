-- AlterTable
ALTER TABLE "membership_plan_durations" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "plan_durations" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
