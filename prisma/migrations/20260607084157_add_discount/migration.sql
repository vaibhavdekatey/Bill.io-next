-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "discount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "discount" DECIMAL(65,30) NOT NULL DEFAULT 0;
