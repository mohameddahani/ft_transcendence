-- CreateIndex
CREATE INDEX "admin_notifications_admin_id_idx" ON "admin_notifications"("admin_id");

-- CreateIndex
CREATE INDEX "member_action_tokens_member_id_idx" ON "member_action_tokens"("member_id");

-- CreateIndex
CREATE INDEX "member_notifications_member_id_idx" ON "member_notifications"("member_id");

-- CreateIndex
CREATE INDEX "member_refresh_tokens_member_id_idx" ON "member_refresh_tokens"("member_id");

-- CreateIndex
CREATE INDEX "members_admin_id_first_name_last_name_idx" ON "members"("admin_id", "first_name", "last_name");

-- CreateIndex
CREATE INDEX "membership_plans_admin_id_plan_name_idx" ON "membership_plans"("admin_id", "plan_name");

-- CreateIndex
CREATE INDEX "memberships_admin_id_member_id_idx" ON "memberships"("admin_id", "member_id");

-- CreateIndex
CREATE INDEX "payments_admin_id_member_id_idx" ON "payments"("admin_id", "member_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "user_action_tokens_user_id_idx" ON "user_action_tokens"("user_id");

-- CreateIndex
CREATE INDEX "user_refresh_tokens_user_id_idx" ON "user_refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "users_first_name_last_name_idx" ON "users"("first_name", "last_name");
