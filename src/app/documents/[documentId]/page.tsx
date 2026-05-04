import { DocumentDetail } from "@/features/documents/components/document-details";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";

interface Props {
  params: Promise<{ documentId: string }>;
}

export default async function DocumentPage({ params }: Props) {
  const { documentId } = await params;
  prefetch(trpc.documents.getOne.queryOptions({ id: documentId }));

  return (
    <HydrateClient>
      <Suspense
        fallback={
          <p className="p-6 text-muted-foreground">Loading document…</p>
        }
      >
        <DocumentDetail id={documentId} />
      </Suspense>
    </HydrateClient>
  );
}
