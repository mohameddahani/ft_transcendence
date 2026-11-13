-- AlterTable
ALTER TABLE "member_action_tokens" ADD COLUMN     "pending_email" TEXT;

-- AlterTable
ALTER TABLE "staff_action_tokens" ADD COLUMN     "pending_email" TEXT;

-- AlterTable
ALTER TABLE "user_action_tokens" ADD COLUMN     "pending_email" TEXT;
