/*
  Warnings:

  - Added the required column `format` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "extractedJson" JSONB,
ADD COLUMN     "format" "Format" NOT NULL,
ADD COLUMN     "rawText" TEXT,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'UPLOADED';
