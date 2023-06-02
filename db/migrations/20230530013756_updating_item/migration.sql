/*
  Warnings:

  - Added the required column `name` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `percent_consumed` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ItemStatusType" AS ENUM ('BAD', 'EATEN', 'FRESH');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "percent_consumed" DECIMAL(3,2) NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "status" "ItemStatusType" NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL;
