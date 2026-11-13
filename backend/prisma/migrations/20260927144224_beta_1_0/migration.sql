-- AlterTable
ALTER TABLE "members" ALTER COLUMN "profile_image_url" DROP DEFAULT;

-- AlterTable
ALTER TABLE "staffs" ALTER COLUMN "profile_image_url" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "profile_image_url" DROP DEFAULT;
