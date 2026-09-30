-- CreateIndex
CREATE INDEX "members_admin_id_idx" ON "members"("admin_id");

-- CreateIndex
CREATE INDEX "members_admin_id_email_phone_number_idx" ON "members"("admin_id", "email", "phone_number");

-- CreateIndex
CREATE INDEX "membership_plan_durations_membership_plan_id_idx" ON "membership_plan_durations"("membership_plan_id");

-- CreateIndex
CREATE INDEX "membership_plans_admin_id_idx" ON "membership_plans"("admin_id");

-- CreateIndex
CREATE INDEX "memberships_membership_status_idx" ON "memberships"("membership_status");

-- CreateIndex
CREATE INDEX "memberships_membership_status_expires_at_idx" ON "memberships"("membership_status", "expires_at");

-- CreateIndex
CREATE INDEX "memberships_admin_id_membership_plan_id_membership_status_idx" ON "memberships"("admin_id", "membership_plan_id", "membership_status");

-- CreateIndex
CREATE INDEX "memberships_member_id_membership_status_idx" ON "memberships"("member_id", "membership_status");

-- CreateIndex
CREATE INDEX "payments_member_id_idx" ON "payments"("member_id");

-- CreateIndex
CREATE INDEX "payments_payment_status_idx" ON "payments"("payment_status");

-- CreateIndex
CREATE INDEX "payments_payment_status_due_date_idx" ON "payments"("payment_status", "due_date");

-- CreateIndex
CREATE INDEX "subscriptions_subscription_status_idx" ON "subscriptions"("subscription_status");

-- CreateIndex
CREATE INDEX "subscriptions_subscription_status_expires_at_idx" ON "subscriptions"("subscription_status", "expires_at");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_subscription_status_idx" ON "subscriptions"("user_id", "subscription_status");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_subscription_status_idx" ON "subscriptions"("plan_id", "subscription_status");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");
