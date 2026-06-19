/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_name_key" ON "subscriptions"("name");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_name_fkey" FOREIGN KEY ("name") REFERENCES "plans"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
