-- CreateTable
CREATE TABLE "membership_rewards" (
    "membership_id" UUID NOT NULL,
    "rewarded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "membership_rewards_pkey" PRIMARY KEY ("membership_id")
);
