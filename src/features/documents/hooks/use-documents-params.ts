import { useQueryStates, parseAsString } from 'nuqs'

export const useDocumentsParams = () => {
  return useQueryStates({
    search: parseAsString.withDefault(''),
  })
}