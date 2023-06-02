/*
  Warnings:

  - Added the required column `name` to the `ItemType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ItemType" ADD COLUMN     "name" TEXT NOT NULL;
