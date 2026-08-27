-- CreateEnum
CREATE TYPE "MealName" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');

-- CreateTable
CREATE TABLE "meal_window" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "meal" "MealName" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "minutes" INTEGER NOT NULL,
    "daysMask" INTEGER NOT NULL DEFAULT 127,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_window_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meal_window_enabled_idx" ON "meal_window"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "meal_window_userId_meal_key" ON "meal_window"("userId", "meal");

-- AddForeignKey
ALTER TABLE "meal_window" ADD CONSTRAINT "meal_window_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
