import { useTRPC } from '@/trpc/client'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDocumentsParams } from './use-documents-params'

export const useSuspenseDocuments = () => {
  const trpc = useTRPC()
  const [params] = useDocumentsParams()
  return useSuspenseQuery(trpc.documents.getMany.queryOptions(params))
}

export const useSuspenseDocument = (id: string) => {
  const trpc = useTRPC()
  return useSuspenseQuery(trpc.documents.getOne.queryOptions({ id }))
}

export const useRemoveDocument = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation(
    trpc.documents.remove.mutationOptions({
      onSuccess: () => {
        toast.success('Document removed')
        queryClient.invalidateQueries({ queryKey: trpc.documents.getMany.queryKey() })
      },
      onError: (error) => toast.error(`Failed to remove: ${error.message}`),
    })
  )
}

export const useUpdateStatus = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation(
    trpc.documents.updateStatus.mutationOptions({
      onSuccess: () => {
        toast.success('Status updated')
        queryClient.invalidateQueries({ queryKey: trpc.documents.getMany.queryKey() })
      },
      onError: (error) => toast.error(`Failed to update: ${error.message}`),
    })
  )
}