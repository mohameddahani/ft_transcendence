/*
  Warnings:

  - You are about to drop the column `sentiment` on the `feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `member_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `staff_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `user_action_tokens` table. All the data in the column will be lost.
  - Added the required column `action_token_type` to the `member_action_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `action_token_type` to the `staff_action_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `action_token_type` to the `user_action_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "feedbacks" DROP COLUMN "sentiment",
ADD COLUMN     "sentiment_type" "SentimentType";

-- AlterTable
ALTER TABLE "member_action_tokens" DROP COLUMN "type",
ADD COLUMN     "action_token_type" "ActionTokenType" NOT NULL;

-- AlterTable
ALTER TABLE "staff_action_tokens" DROP COLUMN "type",
ADD COLUMN     "action_token_type" "ActionTokenType" NOT NULL;

-- AlterTable
ALTER TABLE "user_action_tokens" DROP COLUMN "type",
ADD COLUMN     "action_token_type" "ActionTokenType" NOT NULL;
