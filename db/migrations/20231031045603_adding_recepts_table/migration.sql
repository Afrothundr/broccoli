-- CreateTable
CREATE TABLE "Receipt" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groceryTripId" INTEGER,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_groceryTripId_fkey" FOREIGN KEY ("groceryTripId") REFERENCES "GroceryTrip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
