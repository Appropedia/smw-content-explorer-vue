import { defineQueryOptions } from '@pinia/colada'
import { askRequest } from '@/api/semantic-mediawiki.js'

export const askQuery = defineQueryOptions((baseAPIUrl, queryDescriptor) => ({
  key: ['semantic-mediawiki', baseAPIUrl, queryDescriptor],
  query: () => askRequest(baseAPIUrl, queryDescriptor),
}))
