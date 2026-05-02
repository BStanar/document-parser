'use client'

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { FileTextIcon, ImageIcon, FileSpreadsheetIcon, FileIcon } from 'lucide-react'
import { useDocuments } from '@/features/documents/hooks/use-documents'

const formatIcon = {
  PDF: <FileTextIcon className="size-4" />,
  IMAGE: <ImageIcon className="size-4" />,
  CSV: <FileSpreadsheetIcon className="size-4" />,
  TXT: <FileIcon className="size-4" />,
}

const statusStyle = {
  UPLOADED: 'bg-secondary text-secondary-foreground',
  NEEDS_REVIEW: 'bg-yellow-100 text-yellow-800',
  VALIDATED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export const DocumentsTable = () => {
  const { data: documents = [], isLoading, error } = useDocuments()

  if (isLoading) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        Loading documents...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10 text-destructive text-sm">
        Failed to load documents.
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        No documents uploaded yet.
      </div>
    )
  }

  return (
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
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium">{doc.filename}</TableCell>
            <TableCell>
              <span className="flex items-center gap-1 text-muted-foreground">
                {formatIcon[doc.format]}
                {doc.format}
              </span>
            </TableCell>
            <TableCell>{doc.type ?? '-'}</TableCell>
            <TableCell>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[doc.status]}`}>
                {doc.status.replace('_', ' ')}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(doc.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}