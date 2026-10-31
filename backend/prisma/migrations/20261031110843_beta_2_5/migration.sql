/*
  Warnings:

  - You are about to drop the column `due_date` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `expiration_notified_at` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `payment_status` on the `payments` table. All the data in the column will be lost.
  - Made the column `paid_at` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PAID', 'DUE_SOON', 'UNPAID', 'CANCELLED');

-- DropIndex
DROP INDEX "payments_payment_status_due_date_idx";

-- DropIndex
DROP INDEX "payments_payment_status_idx";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "due_date",
DROP COLUMN "expiration_notified_at",
DROP COLUMN "payment_status",
ALTER COLUMN "paid_at" SET NOT NULL;

-- DropEnum
DROP TYPE "PaymentStatus";

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "membership_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "invoice_status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "expiration_notified_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoices_admin_id_idx" ON "invoices"("admin_id");

-- CreateIndex
CREATE INDEX "invoices_member_id_idx" ON "invoices"("member_id");

-- CreateIndex
CREATE INDEX "invoices_invoice_status_idx" ON "invoices"("invoice_status");

-- CreateIndex
CREATE INDEX "invoices_invoice_status_due_date_idx" ON "invoices"("invoice_status", "due_date");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
