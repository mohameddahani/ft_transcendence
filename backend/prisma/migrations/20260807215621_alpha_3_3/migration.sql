-- AlterTable
ALTER TABLE "members" ALTER COLUMN "profile_image_public_id" DROP NOT NULL,
ALTER COLUMN "profile_image_public_id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "profile_image_public_id" DROP NOT NULL,
ALTER COLUMN "profile_image_public_id" DROP DEFAULT;
