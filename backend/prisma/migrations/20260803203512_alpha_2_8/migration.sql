/*
  Warnings:

  - You are about to drop the column `adminId` on the `admin_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `admin_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `admin_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notificationType` on the `admin_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `member_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `member_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `member_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHash` on the `member_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `member_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `member_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `member_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `member_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `member_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notificationType` on the `member_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `member_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `member_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `member_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `member_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `member_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `member_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `accountStatus` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `adminId` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContact` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `membership_plan_durations` table. All the data in the column will be lost.
  - You are about to drop the column `durationDays` on the `membership_plan_durations` table. All the data in the column will be lost.
  - You are about to drop the column `membershipPlanId` on the `membership_plan_durations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `membership_plan_durations` table. All the data in the column will be lost.
  - You are about to drop the column `adminId` on the `membership_plans` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `membership_plans` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `membership_plans` table. All the data in the column will be lost.
  - You are about to drop the column `planName` on the `membership_plans` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `membership_plans` table. All the data in the column will be lost.
  - You are about to drop the column `adminId` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `membershipPlanDurationId` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `membershipPlanId` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `membershipStatus` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `adminId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `plan_durations` table. All the data in the column will be lost.
  - You are about to drop the column `durationDays` on the `plan_durations` table. All the data in the column will be lost.
  - You are about to drop the column `planId` on the `plan_durations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `plan_durations` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `maxMembers` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `planName` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `planDurationId` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `planId` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionStatus` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `user_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHash` on the `user_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `user_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `user_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `user_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `user_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `accountStatus` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isAccountVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `termsAccepted` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token_hash]` on the table `member_action_tokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_name]` on the table `members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[plan_name]` on the table `plans` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token_hash]` on the table `user_action_tokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_name]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone_number]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `admin_id` to the `admin_notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notification_type` to the `admin_notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `member_action_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `member_id` to the `member_action_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_hash` to the `member_action_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `member_action_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `member_id` to the `member_notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notification_type` to the `member_notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `member_refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `member_id` to the `member_refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `member_refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admin_id` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birth_date` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergency_contact` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone_number` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_name` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration_days` to the `membership_plan_durations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `membership_plan_id` to the `membership_plan_durations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `membership_plan_durations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admin_id` to the `membership_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan_name` to the `membership_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `membership_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admin_id` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `member_id` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `membership_plan_duration_id` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `membership_plan_id` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admin_id` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `due_date` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `member_id` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paid_at` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration_days` to the `plan_durations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan_id` to the `plan_durations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `plan_durations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_members` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan_name` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan_duration_id` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan_id` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `user_action_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_hash` to the `user_action_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_action_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_action_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `user_refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birth_date` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone_number` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `terms_accepted` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "admin_notifications" DROP CONSTRAINT "admin_notifications_adminId_fkey";

-- DropForeignKey
ALTER TABLE "member_action_tokens" DROP CONSTRAINT "member_action_tokens_memberId_fkey";

-- DropForeignKey
ALTER TABLE "member_notifications" DROP CONSTRAINT "member_notifications_memberId_fkey";

-- DropForeignKey
ALTER TABLE "member_refresh_tokens" DROP CONSTRAINT "member_refresh_tokens_memberId_fkey";

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_adminId_fkey";

-- DropForeignKey
ALTER TABLE "membership_plan_durations" DROP CONSTRAINT "membership_plan_durations_membershipPlanId_fkey";

-- DropForeignKey
ALTER TABLE "membership_plans" DROP CONSTRAINT "membership_plans_adminId_fkey";

-- DropForeignKey
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_adminId_fkey";

-- DropForeignKey
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_memberId_fkey";

-- DropForeignKey
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_membershipPlanDurationId_fkey";

-- DropForeignKey
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_membershipPlanId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_adminId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_memberId_fkey";

-- DropForeignKey
ALTER TABLE "plan_durations" DROP CONSTRAINT "plan_durations_planId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_planDurationId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_planId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_action_tokens" DROP CONSTRAINT "user_action_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_refresh_tokens" DROP CONSTRAINT "user_refresh_tokens_userId_fkey";

-- DropIndex
DROP INDEX "member_action_tokens_tokenHash_key";

-- DropIndex
DROP INDEX "members_userName_key";

-- DropIndex
DROP INDEX "plans_planName_key";

-- DropIndex
DROP INDEX "user_action_tokens_tokenHash_key";

-- DropIndex
DROP INDEX "users_phoneNumber_key";

-- DropIndex
DROP INDEX "users_userName_key";

-- AlterTable
ALTER TABLE "admin_notifications" DROP COLUMN "adminId",
DROP COLUMN "createdAt",
DROP COLUMN "isRead",
DROP COLUMN "notificationType",
ADD COLUMN     "admin_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notification_type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "member_action_tokens" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "memberId",
DROP COLUMN "tokenHash",
DROP COLUMN "updatedAt",
DROP COLUMN "usedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "member_id" TEXT NOT NULL,
ADD COLUMN     "token_hash" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "used_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "member_notifications" DROP COLUMN "createdAt",
DROP COLUMN "isRead",
DROP COLUMN "memberId",
DROP COLUMN "notificationType",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "member_id" TEXT NOT NULL,
ADD COLUMN     "notification_type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "member_refresh_tokens" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "memberId",
DROP COLUMN "revokedAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userAgent",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "member_id" TEXT NOT NULL,
ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "members" DROP COLUMN "accountStatus",
DROP COLUMN "adminId",
DROP COLUMN "birthDate",
DROP COLUMN "createdAt",
DROP COLUMN "emergencyContact",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "phoneNumber",
DROP COLUMN "profileImage",
DROP COLUMN "updatedAt",
DROP COLUMN "userName",
ADD COLUMN     "account_status" "MemberAccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "admin_id" TEXT NOT NULL,
ADD COLUMN     "birth_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "emergency_contact" TEXT NOT NULL,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "phone_number" TEXT NOT NULL,
ADD COLUMN     "profile_image" TEXT NOT NULL DEFAULT 'default-member-image.jpg',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "membership_plan_durations" DROP COLUMN "createdAt",
DROP COLUMN "durationDays",
DROP COLUMN "membershipPlanId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "duration_days" INTEGER NOT NULL,
ADD COLUMN     "membership_plan_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "membership_plans" DROP COLUMN "adminId",
DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "planName",
DROP COLUMN "updatedAt",
ADD COLUMN     "admin_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "plan_name" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "memberships" DROP COLUMN "adminId",
DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "memberId",
DROP COLUMN "membershipPlanDurationId",
DROP COLUMN "membershipPlanId",
DROP COLUMN "membershipStatus",
DROP COLUMN "startDate",
DROP COLUMN "updatedAt",
ADD COLUMN     "admin_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "member_id" TEXT NOT NULL,
ADD COLUMN     "membership_plan_duration_id" TEXT NOT NULL,
ADD COLUMN     "membership_plan_id" TEXT NOT NULL,
ADD COLUMN     "membership_status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "adminId",
DROP COLUMN "createdAt",
DROP COLUMN "dueDate",
DROP COLUMN "memberId",
DROP COLUMN "paidAt",
DROP COLUMN "paymentStatus",
DROP COLUMN "updatedAt",
ADD COLUMN     "admin_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "due_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "member_id" TEXT NOT NULL,
ADD COLUMN     "paid_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "plan_durations" DROP COLUMN "createdAt",
DROP COLUMN "durationDays",
DROP COLUMN "planId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "duration_days" INTEGER NOT NULL,
ADD COLUMN     "plan_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "maxMembers",
DROP COLUMN "planName",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_members" INTEGER NOT NULL,
ADD COLUMN     "plan_name" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "planDurationId",
DROP COLUMN "planId",
DROP COLUMN "startedAt",
DROP COLUMN "subscriptionStatus",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "plan_duration_id" TEXT NOT NULL,
ADD COLUMN     "plan_id" TEXT NOT NULL,
ADD COLUMN     "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_action_tokens" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "tokenHash",
DROP COLUMN "updatedAt",
DROP COLUMN "usedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "token_hash" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "used_at" TIMESTAMP(3),
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_refresh_tokens" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "revokedAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userAgent",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_agent" TEXT,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "accountStatus",
DROP COLUMN "birthDate",
DROP COLUMN "companyName",
DROP COLUMN "createdAt",
DROP COLUMN "firstName",
DROP COLUMN "isAccountVerified",
DROP COLUMN "lastName",
DROP COLUMN "phoneNumber",
DROP COLUMN "profileImage",
DROP COLUMN "termsAccepted",
DROP COLUMN "updatedAt",
DROP COLUMN "userName",
ADD COLUMN     "account_status" "UserAccountStatus" NOT NULL DEFAULT 'INACTIVE',
ADD COLUMN     "birth_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "company_name" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "is_account_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "phone_number" TEXT NOT NULL,
ADD COLUMN     "profile_image" TEXT NOT NULL DEFAULT 'default-image.jpg',
ADD COLUMN     "terms_accepted" BOOLEAN NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "member_action_tokens_token_hash_key" ON "member_action_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "members_user_name_key" ON "members"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "plans_plan_name_key" ON "plans"("plan_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_action_tokens_token_hash_key" ON "user_action_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- AddForeignKey
ALTER TABLE "plan_durations" ADD CONSTRAINT "plan_durations_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_duration_id_fkey" FOREIGN KEY ("plan_duration_id") REFERENCES "plan_durations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_membership_plan_id_fkey" FOREIGN KEY ("membership_plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_membership_plan_duration_id_fkey" FOREIGN KEY ("membership_plan_duration_id") REFERENCES "membership_plan_durations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_plans" ADD CONSTRAINT "membership_plans_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_plan_durations" ADD CONSTRAINT "membership_plan_durations_membership_plan_id_fkey" FOREIGN KEY ("membership_plan_id") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_notifications" ADD CONSTRAINT "member_notifications_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_refresh_tokens" ADD CONSTRAINT "user_refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_refresh_tokens" ADD CONSTRAINT "member_refresh_tokens_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_action_tokens" ADD CONSTRAINT "user_action_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_action_tokens" ADD CONSTRAINT "member_action_tokens_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
