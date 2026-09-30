-- CreateIndex
CREATE INDEX "visits_admin_id_member_id_visit_date_idx" ON "visits"("admin_id", "member_id", "visit_date");

-- CreateIndex
CREATE INDEX "visits_admin_id_member_id_visit_date_visit_status_idx" ON "visits"("admin_id", "member_id", "visit_date", "visit_status");

-- CreateIndex
CREATE INDEX "visits_admin_id_qr_token_hash_qr_expires_at_idx" ON "visits"("admin_id", "qr_token_hash", "qr_expires_at");
