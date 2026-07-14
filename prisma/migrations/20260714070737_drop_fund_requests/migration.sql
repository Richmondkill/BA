/*
  Warnings:

  - You are about to drop the `FundRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FundRequest" DROP CONSTRAINT "FundRequest_clientId_fkey";

-- DropForeignKey
ALTER TABLE "FundRequest" DROP CONSTRAINT "FundRequest_reviewedById_fkey";

-- DropTable
DROP TABLE "FundRequest";

-- DropEnum
DROP TYPE "RequestStatus";
