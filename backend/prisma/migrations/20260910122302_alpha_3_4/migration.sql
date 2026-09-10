-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'STAFF';

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "staffId" TEXT;

-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "staffId" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "staffId" TEXT;

-- CreateTable
CREATE TABLE "staffs" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "user_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone_number" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "profile_image_url" TEXT NOT NULL DEFAULT 'default-image.jpg',
    "profile_image_public_id" TEXT,
    "account_status" "UserAccountStatus" NOT NULL DEFAULT 'INACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_notifications" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_refresh_tokens" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "ip" TEXT,
    "user_agent" TEXT,
    "device" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_action_tokens" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "type" "ActionTokenType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_action_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staffs_user_name_key" ON "staffs"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "staffs_email_key" ON "staffs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staffs_phone_number_key" ON "staffs"("phone_number");

-- CreateIndex
CREATE INDEX "staffs_first_name_last_name_idx" ON "staffs"("first_name", "last_name");

-- CreateIndex
CREATE INDEX "staffs_role_idx" ON "staffs"("role");

-- CreateIndex
CREATE INDEX "staff_notifications_staff_id_idx" ON "staff_notifications"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_refresh_tokens_jti_key" ON "staff_refresh_tokens"("jti");

-- CreateIndex
CREATE INDEX "staff_refresh_tokens_staff_id_idx" ON "staff_refresh_tokens"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_action_tokens_token_hash_key" ON "staff_action_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "staff_action_tokens_staff_id_idx" ON "staff_action_tokens"("staff_id");

-- CreateIndex
CREATE INDEX "members_staffId_idx" ON "members"("staffId");

-- CreateIndex
CREATE INDEX "members_staffId_first_name_last_name_idx" ON "members"("staffId", "first_name", "last_name");

-- CreateIndex
CREATE INDEX "members_staffId_email_phone_number_idx" ON "members"("staffId", "email", "phone_number");

-- AddForeignKey
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_notifications" ADD CONSTRAINT "staff_notifications_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_refresh_tokens" ADD CONSTRAINT "staff_refresh_tokens_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_action_tokens" ADD CONSTRAINT "staff_action_tokens_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
