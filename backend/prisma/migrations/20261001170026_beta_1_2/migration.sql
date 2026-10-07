/*
  Warnings:

  - A unique constraint covering the columns `[admin_id,email]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "members_admin_id_email_key" ON "members"("admin_id", "email");
