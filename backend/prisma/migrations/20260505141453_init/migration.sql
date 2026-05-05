-- CreateTable
CREATE TABLE "waaaaaaa3" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "waaaaaaa3_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waaaaaaa3_email_key" ON "waaaaaaa3"("email");
