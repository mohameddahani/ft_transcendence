/*
  Warnings:

  - A unique constraint covering the columns `[admin_id,email]` on the table `staffs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "staffs_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "staffs_admin_id_email_key" ON "staffs"("admin_id", "email");
