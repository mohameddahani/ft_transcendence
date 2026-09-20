/*
  Warnings:

  - You are about to drop the column `qr_expires_at` on the `visits` table. All the data in the column will be lost.
  - Added the required column `visit_date_and_time_expires_at` to the `visits` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "visits_admin_id_qr_token_hash_qr_expires_at_idx";

-- AlterTable
ALTER TABLE "visits" DROP COLUMN "qr_expires_at",
ADD COLUMN     "visit_date_and_time_expires_at" TIMESTAMP(3) NOT NULL;
