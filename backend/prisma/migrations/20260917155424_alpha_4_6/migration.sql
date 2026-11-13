/*
  Warnings:

  - You are about to drop the column `staffId` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `staffId` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `staffId` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `staffId` on the `payments` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SentimentType" AS ENUM ('NEGATIVE', 'NEUTRAL', 'POSITIVE');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_staffId_fkey";

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_staffId_fkey";

-- DropForeignKey
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_staffId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_staffId_fkey";

-- DropIndex
DROP INDEX "members_staffId_email_phone_number_idx";

-- DropIndex
DROP INDEX "members_staffId_first_name_last_name_idx";

-- DropIndex
DROP INDEX "members_staffId_idx";

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "staffId",
ADD COLUMN     "staff_id" TEXT;

-- AlterTable
ALTER TABLE "members" DROP COLUMN "staffId",
ADD COLUMN     "staff_id" TEXT;

-- AlterTable
ALTER TABLE "memberships" DROP COLUMN "staffId",
ADD COLUMN     "staff_id" TEXT;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "staffId",
ADD COLUMN     "staff_id" TEXT,
ALTER COLUMN "due_date" DROP NOT NULL,
ALTER COLUMN "paid_at" DROP NOT NULL;

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "sentiment" "SentimentType",
    "sentiment_score" DECIMAL(3,2),
    "feedback_status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_likes" (
    "id" TEXT NOT NULL,
    "feedback_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedbacks_admin_id_created_at_idx" ON "feedbacks"("admin_id", "created_at");

-- CreateIndex
CREATE INDEX "feedbacks_admin_id_feedback_status_idx" ON "feedbacks"("admin_id", "feedback_status");

-- CreateIndex
CREATE INDEX "feedbacks_staff_id_idx" ON "feedbacks"("staff_id");

-- CreateIndex
CREATE INDEX "feedback_likes_feedback_id_idx" ON "feedback_likes"("feedback_id");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_likes_feedback_id_member_id_key" ON "feedback_likes"("feedback_id", "member_id");

-- CreateIndex
CREATE INDEX "members_staff_id_idx" ON "members"("staff_id");

-- CreateIndex
CREATE INDEX "members_staff_id_first_name_last_name_idx" ON "members"("staff_id", "first_name", "last_name");

-- CreateIndex
CREATE INDEX "members_staff_id_email_phone_number_idx" ON "members"("staff_id", "email", "phone_number");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_likes" ADD CONSTRAINT "feedback_likes_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_likes" ADD CONSTRAINT "feedback_likes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
