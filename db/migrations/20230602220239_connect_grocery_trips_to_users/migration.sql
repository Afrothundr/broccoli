/*
  Warnings:

  - Added the required column `user_id` to the `Grocery_trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `item_type_id` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Grocery_trip" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "item_type_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Item_type" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storage_advice" TEXT NOT NULL,
    "suggested_life_span_seconds" BIGINT NOT NULL,

    CONSTRAINT "Item_type_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "Item_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grocery_trip" ADD CONSTRAINT "Grocery_trip_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
