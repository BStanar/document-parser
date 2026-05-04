"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileTextIcon, ImageIcon, FileSpreadsheetIcon, FileIcon } from "lucide-react";
import { useDocuments, useReprocessPending } from "@/features/documents/hooks/use-documents";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const formatIcon = {
  PDF: <FileTextIcon className="size-4" />,
  IMAGE: <ImageIcon className="size-4" />,
  CSV: <FileSpreadsheetIcon className="size-4" />,
  TXT: <FileIcon className="size-4" />,
};

const statusStyle = {
  UPLOADED: "bg-secondary text-secondary-foreground",
  NEEDS_REVIEW: "bg-yellow-100 text-yellow-800",
  VALIDATED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export const DocumentsTable = () => {
  const { data: documents = [], isLoading, error } = useDocuments();
  const { mutate: reprocessPending, isPending: isReprocessing } = useReprocessPending();

  if (isLoading) {
    return <div className="text-center py-10 text-muted-foreground text-sm">Loading documents...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-destructive text-sm">Failed to load documents.</div>
  }

  if (documents.length === 0) {
    return <div className="text-center py-10 text-muted-foreground text-sm">No documents uploaded yet.</div>
  }

  const pendingCount = documents.filter((document) => document.status === 'UPLOADED').length

  return (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <Button
          size="sm"
          variant="outline"
          disabled={isReprocessing}
          onClick={() => reprocessPending()}
        >
          {isReprocessing ? 'Queuing...' : `Reprocess ${pendingCount} pending`}
        </Button>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Uploaded</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">
                <Link href={`/documents/${document.id}`} className="hover:underline">
                  {document.filename}
                </Link>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1 text-muted-foreground">
                  {formatIcon[document.format]}
                  {document.format}
                </span>
              </TableCell>
              <TableCell>{document.type ?? "-"}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[document.status]}`}>
                  {document.status.replace("_", " ")}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(document.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};