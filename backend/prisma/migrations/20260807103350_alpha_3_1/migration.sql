/*
  Warnings:

  - You are about to drop the column `profile_image` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `profile_image` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "members" DROP COLUMN "profile_image",
ADD COLUMN     "profile_image_public_id" TEXT NOT NULL DEFAULT 'default-member-image',
ADD COLUMN     "profile_image_url" TEXT NOT NULL DEFAULT 'default-member-image.jpg';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "profile_image",
ADD COLUMN     "profile_image_public_id" TEXT NOT NULL DEFAULT 'default-image',
ADD COLUMN     "profile_image_url" TEXT NOT NULL DEFAULT 'default-image.jpg';
