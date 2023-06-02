/*
  Warnings:

  - Added the required column `grocery_trip_id` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "grocery_trip_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Grocery_trip" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Grocery_trip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_grocery_trip_id_fkey" FOREIGN KEY ("grocery_trip_id") REFERENCES "Grocery_trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
