/*
  Warnings:

  - You are about to drop the `ItemTypesOnItems` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ItemTypesOnItems" DROP CONSTRAINT "ItemTypesOnItems_itemId_fkey";

-- DropForeignKey
ALTER TABLE "ItemTypesOnItems" DROP CONSTRAINT "ItemTypesOnItems_itemTypeId_fkey";

-- DropTable
DROP TABLE "ItemTypesOnItems";

-- CreateTable
CREATE TABLE "_ItemToItemType" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ItemToItemType_AB_unique" ON "_ItemToItemType"("A", "B");

-- CreateIndex
CREATE INDEX "_ItemToItemType_B_index" ON "_ItemToItemType"("B");

-- AddForeignKey
ALTER TABLE "_ItemToItemType" ADD CONSTRAINT "_ItemToItemType_A_fkey" FOREIGN KEY ("A") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemToItemType" ADD CONSTRAINT "_ItemToItemType_B_fkey" FOREIGN KEY ("B") REFERENCES "ItemType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
