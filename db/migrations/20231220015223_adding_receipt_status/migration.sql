-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PROCESSING', 'IMPORTED', 'ERROR');

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "status" "ReceiptStatus" NOT NULL DEFAULT 'IMPORTED';
