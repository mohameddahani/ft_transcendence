/*
  Warnings:

  - You are about to drop the column `sentiment_type` on the `feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `action_token_type` on the `member_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `action_token_type` on the `staff_action_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `action_token_type` on the `user_action_tokens` table. All the data in the column will be lost.
  - Added the required column `type` to the `member_action_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `staff_action_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `user_action_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "feedbacks" DROP COLUMN "sentiment_type",
ADD COLUMN     "sentiment" "SentimentType";

-- AlterTable
ALTER TABLE "member_action_tokens" DROP COLUMN "action_token_type",
ADD COLUMN     "type" "ActionTokenType" NOT NULL;

-- AlterTable
ALTER TABLE "staff_action_tokens" DROP COLUMN "action_token_type",
ADD COLUMN     "type" "ActionTokenType" NOT NULL;

-- AlterTable
ALTER TABLE "user_action_tokens" DROP COLUMN "action_token_type",
ADD COLUMN     "type" "ActionTokenType" NOT NULL;
