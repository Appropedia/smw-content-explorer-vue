import { computed } from 'vue'
import { useResultFiltersStore } from '@/stores/result-filters.js'
import { getPrintoutValues, checkFilters } from '@/helpers/semantic-mediawiki.js'

//Get a reference to the active filters from the store
const resultFilters = useResultFiltersStore()

//Given a reactive variable with the contents of a Semantic Mediawiki API response, get a reactive
//list of filtered pages by applying the filters from the store, in the form of the following
//structure: [ { pageName, pageProperties } ]
//Note: Merge rules apply to the filtering process; see the checkFilters function for details
export function useFilteredPages(queryData, mergeRules) {
  //All printout values are derived (and cached) from the API response directly
  const printoutValues = computed(() => getPrintoutValues(queryData.value))

  //Decompose the results member of the API response into key/value pairs, filter them and map them
  //to an object array
  return computed(() => Object.entries(queryData.value.results)
    .filter(([pageName,]) => checkFilters(printoutValues.value[pageName], resultFilters.applied,
                                          mergeRules))
    .map(([pageName, pageProperties]) => ({ pageName: pageName, pageProperties: pageProperties }))
  )
}
