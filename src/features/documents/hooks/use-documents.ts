import { useTRPC } from '@/trpc/client'
import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDocumentsParams } from './use-documents-params'



export const useDocuments = () => {
  const trpc = useTRPC()
  const [params] = useDocumentsParams()
  return useQuery({
    ...trpc.documents.getMany.queryOptions(params),
    refetchInterval: (query) => {
      const hasPending = query.state.data?.some((d) => d.status === 'UPLOADED')
      return hasPending ? 2000 : false
    },
  })
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