import { DocumentDetail } from '@/features/documents/components/document-details'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

interface Props {
  params: Promise<{ documentId: string }>
}

export default async function DocumentPage({ params }: Props) {
  const { documentId } = await params
  prefetch(trpc.documents.getOne.queryOptions({ id: documentId }))

  return (
    <HydrateClient>
      <DocumentDetail id={documentId} />
    </HydrateClient>
  )
}