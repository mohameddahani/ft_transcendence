/*
  Warnings:

  - You are about to drop the column `membership_plan_id` on the `attendances` table. All the data in the column will be lost.
  - Added the required column `membership_id` to the `attendances` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_membership_plan_id_fkey";

-- DropIndex
DROP INDEX "attendances_membership_plan_id_checked_in_at_idx";

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "membership_plan_id",
ADD COLUMN     "membership_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "attendances_membership_id_checked_in_at_idx" ON "attendances"("membership_id", "checked_in_at");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
