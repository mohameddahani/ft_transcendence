/*
  Warnings:

  - The values [OVERDUE] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PAID', 'UNPAID', 'DUE_SOON');
ALTER TABLE "public"."payments" ALTER COLUMN "payment_status" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "payment_status" TYPE "PaymentStatus_new" USING ("payment_status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "payments" ALTER COLUMN "payment_status" SET DEFAULT 'UNPAID';
COMMIT;
