-- CreateTable
CREATE TABLE "Itemtypesonitem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Itemtypesonitem_pkey" PRIMARY KEY ("id")
);
