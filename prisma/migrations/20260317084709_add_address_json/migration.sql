/*
  Warnings:

  - The `address` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `issuerAddress` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `clientAddress` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `address` column on the `Organization` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `issuerAddress` column on the `Quotation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `clientAddress` column on the `Quotation` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "address",
ADD COLUMN     "address" JSONB;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "issuerAddress",
ADD COLUMN     "issuerAddress" JSONB,
DROP COLUMN "clientAddress",
ADD COLUMN     "clientAddress" JSONB;

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "address",
ADD COLUMN     "address" JSONB;

-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "issuerAddress",
ADD COLUMN     "issuerAddress" JSONB,
DROP COLUMN "clientAddress",
ADD COLUMN     "clientAddress" JSONB;
