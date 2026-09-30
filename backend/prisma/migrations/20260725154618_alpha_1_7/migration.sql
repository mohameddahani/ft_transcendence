/*
  Warnings:

  - You are about to drop the column `userType` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `userType` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "members" DROP COLUMN "userType",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "userType",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'ADMIN';

-- DropEnum
DROP TYPE "UserType";
