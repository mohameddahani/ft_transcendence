/*
  Warnings:

  - Changed the type of `type` on the `MemberActionToken` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `UserActionToken` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ActionTokenType" AS ENUM ('EMAIL_VERIFICATION', 'RESET_PASSWORD', 'SET_PASSWORD');

-- AlterTable
ALTER TABLE "MemberActionToken" DROP COLUMN "type",
ADD COLUMN     "type" "ActionTokenType" NOT NULL;

-- AlterTable
ALTER TABLE "UserActionToken" DROP COLUMN "type",
ADD COLUMN     "type" "ActionTokenType" NOT NULL;

-- DropEnum
DROP TYPE "UserActionTokenType";
