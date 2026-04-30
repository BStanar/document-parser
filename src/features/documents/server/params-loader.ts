import { createLoader, parseAsString } from 'nuqs/server'

export const documentsParamsLoader = createLoader({
  search: parseAsString.withDefault(''),
})