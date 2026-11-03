/*
  Warnings:

  - A unique constraint covering the columns `[admin_id,phone_number]` on the table `staffs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "staffs_admin_id_phone_number_key" ON "staffs"("admin_id", "phone_number");
