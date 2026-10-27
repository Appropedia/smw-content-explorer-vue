import { defineQueryOptions } from '@pinia/colada'
import { askActionRequest } from '@/api/semantic-mediawiki.js'

export const askActionQuery = defineQueryOptions((baseApiUrl, queryDescriptor) => ({
  key: ['semantic-mediawiki', baseApiUrl, queryDescriptor],
  query: () => askActionRequest(baseApiUrl, queryDescriptor),
}))
