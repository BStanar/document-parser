import { prefetch, trpc } from '@/trpc/server'

export const prefetchDocuments = (params: { search?: string }) => {
  return prefetch(trpc.documents.getMany.queryOptions({ search: params.search ?? '' }))
}

export const prefetchDocument = (id: string) => {
  return prefetch(trpc.documents.getOne.queryOptions({ id }))
}