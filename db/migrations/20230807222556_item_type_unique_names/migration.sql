/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `ItemType` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ItemType_name_key" ON "ItemType"("name");
