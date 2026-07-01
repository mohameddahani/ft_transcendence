-- DropForeignKey
ALTER TABLE "planDurations" DROP CONSTRAINT "planDurations_planId_fkey";

-- AddForeignKey
ALTER TABLE "planDurations" ADD CONSTRAINT "planDurations_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
