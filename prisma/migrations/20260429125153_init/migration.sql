-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('INVOICE', 'PURCHASE_ORDER');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "type" "DocumentType",
    "supplierName" TEXT,
    "documentNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "currency" TEXT,
    "subtotal" DOUBLE PRECISION,
    "tax" DOUBLE PRECISION,
    "total" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileData" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
