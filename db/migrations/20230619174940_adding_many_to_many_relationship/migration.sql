/*
  Warnings:

  - You are about to drop the column `itemTypeId` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `percent_consumed` on the `Item` table. All the data in the column will be lost.
  - Added the required column `percentConsumed` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_itemTypeId_fkey";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "itemTypeId",
DROP COLUMN "percent_consumed",
ADD COLUMN     "percentConsumed" DECIMAL(3,2) NOT NULL;

-- CreateTable
CREATE TABLE "ItemTypesOnItems" (
    "itemId" INTEGER NOT NULL,
    "itemTypeId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemTypesOnItems_pkey" PRIMARY KEY ("itemId","itemTypeId")
);

-- AddForeignKey
ALTER TABLE "ItemTypesOnItems" ADD CONSTRAINT "ItemTypesOnItems_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTypesOnItems" ADD CONSTRAINT "ItemTypesOnItems_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
