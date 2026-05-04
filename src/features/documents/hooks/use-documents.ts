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

export const useDocument = (id: string) => {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.documents.getOne.queryOptions({ id }),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'UPLOADED' ? 2000 : false
    },
  })
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
      onSuccess: (_, variables) => {
        toast.success('Status updated')
        queryClient.invalidateQueries({ queryKey: trpc.documents.getMany.queryKey() })
        queryClient.invalidateQueries({ queryKey: trpc.documents.getOne.queryKey({ id: variables.id }) })
      },
      onError: (error) => toast.error(`Failed to update: ${error.message}`),
    })
  )
}

export const useUpdateDocument = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation(
    trpc.documents.update.mutationOptions({
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: trpc.documents.getOne.queryKey({ id: variables.id }) })
        queryClient.invalidateQueries({ queryKey: trpc.documents.getMany.queryKey() })
      },
      onError: (error) => toast.error(`Failed to update: ${error.message}`),
    })
  )
}

export const useReprocessDocument = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation(
    trpc.documents.reprocess.mutationOptions({
      onSuccess: (_, variables) => {
        toast.success('Document queued for reprocessing')
        queryClient.invalidateQueries({ queryKey: trpc.documents.getOne.queryKey({ id: variables.id }) })
        queryClient.invalidateQueries({ queryKey: trpc.documents.getMany.queryKey() })
      },
      onError: (error) => toast.error(`Failed to reprocess: ${error.message}`),
    })
  )
}