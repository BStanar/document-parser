import { UploadArea } from '@/components/upload-area'
import { DocumentsTable } from '@/components/documents-table'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const DocumentsPage = () => {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Upload and manage your invoices and purchase orders
        </p>
      </div>
      <UploadArea />
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <DocumentsTable />
      </Suspense>
    </div>
  )
}

export default DocumentsPage