/*
  Warnings:

  - You are about to drop the column `fileData` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "fileData";

-- CreateTable
CREATE TABLE "FileData" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "FileData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileData_documentId_key" ON "FileData"("documentId");

-- AddForeignKey
ALTER TABLE "FileData" ADD CONSTRAINT "FileData_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
