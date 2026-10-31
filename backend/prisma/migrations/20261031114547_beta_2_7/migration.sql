/*
  Warnings:

  - You are about to drop the column `due_date` on the `invoices` table. All the data in the column will be lost.
  - Added the required column `payment_due_at` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "invoices_invoice_status_due_date_idx";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "due_date",
ADD COLUMN     "payment_due_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "invoices_invoice_status_payment_due_at_idx" ON "invoices"("invoice_status", "payment_due_at");
