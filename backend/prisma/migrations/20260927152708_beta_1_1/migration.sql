/*
  Warnings:

  - Made the column `profile_image_public_id` on table `members` required. This step will fail if there are existing NULL values in that column.
  - Made the column `profile_image_public_id` on table `staffs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `profile_image_public_id` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "members" ALTER COLUMN "profile_image_public_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "staffs" ALTER COLUMN "profile_image_public_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "profile_image_public_id" SET NOT NULL;
