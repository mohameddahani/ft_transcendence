-- CreateTable
CREATE TABLE "gym_working_hours" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gym_working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gym_special_hours" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gym_special_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gym_working_hours_admin_id_day_of_week_idx" ON "gym_working_hours"("admin_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "gym_working_hours_admin_id_day_of_week_start_time_key" ON "gym_working_hours"("admin_id", "day_of_week", "start_time");

-- CreateIndex
CREATE INDEX "gym_special_hours_admin_id_date_idx" ON "gym_special_hours"("admin_id", "date");

-- AddForeignKey
ALTER TABLE "gym_working_hours" ADD CONSTRAINT "gym_working_hours_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_special_hours" ADD CONSTRAINT "gym_special_hours_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
