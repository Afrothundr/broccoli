/*
  Warnings:

  - You are about to drop the column `grocery_trip_id` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `item_type_id` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `item_id` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the `Grocery_trip` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Item_type` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `groceryTripId` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemTypeId` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `Reminder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Reminder` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Grocery_trip" DROP CONSTRAINT "Grocery_trip_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_grocery_trip_id_fkey";

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_item_type_id_fkey";

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_item_id_fkey";

-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_user_id_fkey";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "grocery_trip_id",
DROP COLUMN "item_type_id",
DROP COLUMN "user_id",
ADD COLUMN     "groceryTripId" INTEGER NOT NULL,
ADD COLUMN     "itemTypeId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "item_id",
DROP COLUMN "user_id",
ADD COLUMN     "itemId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Grocery_trip";

-- DropTable
DROP TABLE "Item_type";

-- CreateTable
CREATE TABLE "GroceryTrip" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "GroceryTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemType" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storage_advice" TEXT NOT NULL,
    "suggested_life_span_seconds" BIGINT NOT NULL,

    CONSTRAINT "ItemType_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_groceryTripId_fkey" FOREIGN KEY ("groceryTripId") REFERENCES "GroceryTrip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryTrip" ADD CONSTRAINT "GroceryTrip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
