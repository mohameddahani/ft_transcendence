/*
  Warnings:

  - You are about to drop the `gym_special_hours` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gym_working_hours` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "gym_special_hours" DROP CONSTRAINT "gym_special_hours_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "gym_working_hours" DROP CONSTRAINT "gym_working_hours_admin_id_fkey";

-- DropTable
DROP TABLE "gym_special_hours";

-- DropTable
DROP TABLE "gym_working_hours";

-- CreateTable
CREATE TABLE "working_hours" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_hours" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "special_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "working_hours_admin_id_day_of_week_idx" ON "working_hours"("admin_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "working_hours_admin_id_day_of_week_start_time_key" ON "working_hours"("admin_id", "day_of_week", "start_time");

-- CreateIndex
CREATE INDEX "special_hours_admin_id_date_idx" ON "special_hours"("admin_id", "date");

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_hours" ADD CONSTRAINT "special_hours_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
