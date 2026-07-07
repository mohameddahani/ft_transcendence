/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");
