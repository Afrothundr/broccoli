-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'EATEN', 'TOSSED');

-- DropIndex
DROP INDEX "item_userId_idx";

-- AlterTable
ALTER TABLE "item" ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "item_userId_status_idx" ON "item"("userId", "status");
