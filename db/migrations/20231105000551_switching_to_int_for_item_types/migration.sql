/*
  Warnings:

  - You are about to alter the column `suggested_life_span_seconds` on the `ItemType` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "ItemType" ALTER COLUMN "suggested_life_span_seconds" SET DATA TYPE INTEGER;
