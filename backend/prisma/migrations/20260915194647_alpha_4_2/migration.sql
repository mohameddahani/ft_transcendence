-- CreateIndex
CREATE INDEX "attendances_admin_id_member_id_checked_in_at_idx" ON "attendances"("admin_id", "member_id", "checked_in_at");
