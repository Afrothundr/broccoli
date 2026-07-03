-- CreateEnum
CREATE TYPE "StorageLocation" AS ENUM ('PANTRY', 'FRIDGE', 'FREEZER');

-- CreateEnum
CREATE TYPE "ExpirationSource" AS ENUM ('FOODKEEPER', 'LLM', 'USER');

-- AlterEnum
ALTER TYPE "ItemStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "item" ADD COLUMN     "expirationSource" "ExpirationSource",
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "itemTypeId" TEXT,
ADD COLUMN     "storageLocation" "StorageLocation";

-- AlterTable
ALTER TABLE "item_type" ADD COLUMN     "freezerSeconds" INTEGER,
ADD COLUMN     "freezerTip" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "fridgeSeconds" INTEGER,
ADD COLUMN     "fridgeTip" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pantrySeconds" INTEGER,
ADD COLUMN     "pantryTip" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "item_status_expiresAt_idx" ON "item"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "item_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;
