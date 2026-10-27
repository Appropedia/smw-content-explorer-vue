import { defineQueryOptions } from '@pinia/colada'
import { queryActionRequest } from '@/api/mediawiki.js'

export const queryActionQuery = defineQueryOptions((baseApiUrl, requestParameters) => ({
  key: ['mediawiki', baseApiUrl, requestParameters],
  query: () => queryActionRequest(baseApiUrl, requestParameters),
}))
