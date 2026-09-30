/*
  Warnings:

  - You are about to drop the column `type` on the `admin_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `member_notifications` table. All the data in the column will be lost.
  - Added the required column `notificationType` to the `admin_notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notificationType` to the `member_notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admin_notifications" DROP COLUMN "type",
ADD COLUMN     "notificationType" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "member_notifications" DROP COLUMN "type",
ADD COLUMN     "notificationType" "NotificationType" NOT NULL;
