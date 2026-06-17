/*
  Warnings:

  - The values [active,inactive,pending,banned] on the enum `AccountStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [male,female] on the enum `Gender` will be removed. If these variants are still used in the database, this will fail.
  - The values [active,expired,frozen,cancelled] on the enum `MemberStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [monthly,quarterly,semi_annual,annual,custom] on the enum `MembershipDuration` will be removed. If these variants are still used in the database, this will fail.
  - The values [payment_reminder,membership_expiration,custom] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [paid,partial,unpaid,overdue] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [free,basic,pro,enterprise] on the enum `PlanType` will be removed. If these variants are still used in the database, this will fail.
  - The values [active,expired,cancelled] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [owner,admin,user] on the enum `UserType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AccountStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'BANNED');
ALTER TABLE "public"."users" ALTER COLUMN "accountStatus" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "accountStatus" TYPE "AccountStatus_new" USING ("accountStatus"::text::"AccountStatus_new");
ALTER TYPE "AccountStatus" RENAME TO "AccountStatus_old";
ALTER TYPE "AccountStatus_new" RENAME TO "AccountStatus";
DROP TYPE "public"."AccountStatus_old";
ALTER TABLE "users" ALTER COLUMN "accountStatus" SET DEFAULT 'INACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('MALE', 'FEMALE');
ALTER TABLE "users" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TABLE "members" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "public"."Gender_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MemberStatus_new" AS ENUM ('ACTIVE', 'EXPIRED', 'FROZEN', 'CANCELLED');
ALTER TABLE "members" ALTER COLUMN "status" TYPE "MemberStatus_new" USING ("status"::text::"MemberStatus_new");
ALTER TYPE "MemberStatus" RENAME TO "MemberStatus_old";
ALTER TYPE "MemberStatus_new" RENAME TO "MemberStatus";
DROP TYPE "public"."MemberStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MembershipDuration_new" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'CUSTOM');
ALTER TABLE "public"."membershipPlans" ALTER COLUMN "duration" DROP DEFAULT;
ALTER TABLE "membershipPlans" ALTER COLUMN "duration" TYPE "MembershipDuration_new" USING ("duration"::text::"MembershipDuration_new");
ALTER TYPE "MembershipDuration" RENAME TO "MembershipDuration_old";
ALTER TYPE "MembershipDuration_new" RENAME TO "MembershipDuration";
DROP TYPE "public"."MembershipDuration_old";
ALTER TABLE "membershipPlans" ALTER COLUMN "duration" SET DEFAULT 'MONTHLY';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('PAYMENT_REMINDER', 'MEMBERSHIP_EXPIRATION', 'CUSTOM');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PAID', 'PARTIAL', 'UNPAID', 'OVERDUE');
ALTER TABLE "payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PlanType_new" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');
ALTER TABLE "public"."subscriptions" ALTER COLUMN "planType" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "planType" TYPE "PlanType_new" USING ("planType"::text::"PlanType_new");
ALTER TYPE "PlanType" RENAME TO "PlanType_old";
ALTER TYPE "PlanType_new" RENAME TO "PlanType";
DROP TYPE "public"."PlanType_old";
ALTER TABLE "subscriptions" ALTER COLUMN "planType" SET DEFAULT 'FREE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
ALTER TABLE "public"."subscriptions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "public"."SubscriptionStatus_old";
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserType_new" AS ENUM ('OWNER', 'ADMIN', 'USER');
ALTER TABLE "public"."users" ALTER COLUMN "userType" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "userType" TYPE "UserType_new" USING ("userType"::text::"UserType_new");
ALTER TYPE "UserType" RENAME TO "UserType_old";
ALTER TYPE "UserType_new" RENAME TO "UserType";
DROP TYPE "public"."UserType_old";
ALTER TABLE "users" ALTER COLUMN "userType" SET DEFAULT 'ADMIN';
COMMIT;

-- AlterTable
ALTER TABLE "membershipPlans" ALTER COLUMN "duration" SET DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "planType" SET DEFAULT 'FREE',
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "userType" SET DEFAULT 'ADMIN',
ALTER COLUMN "accountStatus" SET DEFAULT 'INACTIVE';
