-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PROCESSING', 'READY', 'SAVED', 'ERROR');

-- CreateTable
CREATE TABLE "receipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageKey" TEXT,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'PROCESSING',
    "storeName" TEXT,
    "purchasedAt" TIMESTAMP(3),
    "total" DOUBLE PRECISION,
    "rawExtraction" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT '',
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "suggestedLifeSpanSeconds" INTEGER NOT NULL,
    "storageAdvice" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'FoodKeeper',
    "raw" JSONB,

    CONSTRAINT "item_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "receipt_userId_idx" ON "receipt"("userId");

-- CreateIndex
CREATE INDEX "item_receiptId_idx" ON "item"("receiptId");

-- CreateIndex
CREATE INDEX "item_userId_idx" ON "item"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "item_type_name_key" ON "item_type"("name");

-- AddForeignKey
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
