/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `member_refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hash]` on the table `staff_refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hash]` on the table `user_refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[qr_token_hash]` on the table `visits` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "member_refresh_tokens_hash_key" ON "member_refresh_tokens"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "staff_refresh_tokens_hash_key" ON "staff_refresh_tokens"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "user_refresh_tokens_hash_key" ON "user_refresh_tokens"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "visits_qr_token_hash_key" ON "visits"("qr_token_hash");
