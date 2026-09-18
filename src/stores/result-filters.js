import { defineStore } from 'pinia'

export const useResultFiltersStore = defineStore('result-filters', {
  state: () => ({
    applied: {},
  }),
})
