<!--
  This component provides a view that lists sub pages of TissueDB/Tissues, allowing to filter pages
  by the 'Page keywords' semantic property.
-->
<script setup>
  import { computed } from 'vue'
  import { useQuery } from '@pinia/colada'
  import { askQuery } from '@/queries/semantic-mediawiki.js'
  import {
    countPrintoutValues, removePageNamePrefix, sortResults
  } from '@/helpers/semantic-mediawiki.js'
  import { sortObject } from '@/helpers/misc-helpers.js'
  import { useFilteredPages } from '@/composables/useFilteredPages.js'
  import FilterButtonGroup from '@/components/FilterButtonGroup.vue'

  //Query used for obtaining all page data
  const { state: tissueDBQueryState } = useQuery(
    () => askQuery(
      'https://www.appropedia.org/w/api.php',
      {
        conditions: '[[~TissueDB/Tissues/*]]',
        printouts: ['Page description', 'Page keywords'],
        parameters: { limit: 10000 },
      }
    )
  )

  //Populate the filter radio button group with all values of the 'Page keywords' property that are
  //present in the page data
  const radioButtonItems = computed(() => {
    //Get the count of each page keyword, then sort the keywords by count and then by name
    let printoutCounts = countPrintoutValues(tissueDBQueryState.value.data)['Page keywords']
    printoutCounts = sortObject(printoutCounts)
    printoutCounts = sortObject(printoutCounts, (a, b) => b.value - a.value)

    return Object.entries(printoutCounts).map(([propertyValue, valueCount]) =>
      ({
        label: `${propertyValue} (${valueCount})`,
        value: propertyValue,
      })
    )
  })

  //Sort the results in the query by page name and remove their prefixes
  const tissueDBQueryData = computed(() => {
    return sortResults(removePageNamePrefix(tissueDBQueryState.value.data, 'TissueDB/Tissues/'))
  })

  //Create a reactive list of filtered pages from the query data
  const filteredPages = useFilteredPages(tissueDBQueryData, { 'Page keywords': 'disjunction' })
</script>

<template>
  <div class="flex flex-col h-full">
    <UPageHeader title="Tissues Explorer" />
    <UEmpty v-if="tissueDBQueryState.status === 'pending'" loading title="Loading" class="grow" />
    <UEmpty v-else-if="tissueDBQueryState.status === 'error'" icon="i-lucide-circle-x" class="grow"
      title="Error loading tissue DB pages" :description="tissueDBQueryState.error"
    />
    <div v-else-if="tissueDBQueryState.status === 'success'"
      class="min-h-0 grow flex flex-row gap-4"
    >
      <UScrollArea class="shrink-0">
        <FilterButtonGroup filter-name="Page keywords" button-type="radio" :items="radioButtonItems"
          legend="Keywords" variant="card"
        />
      </UScrollArea>
      <UScrollArea class="grow" :ui="{ viewport: 'p-px' }">
        <template v-if="Object.keys(filteredPages).length === 0">Select a keyword</template>
        <TransitionGroup v-else tag="div" class="flex flex-col gap-2">
          <div v-for="{ pageName, pageProperties } in filteredPages" :key="pageName">
            <UPageCard>
              <template #title>
                <ULink :to="pageProperties.fullurl" active external target="_blank">
                  {{ pageName }}
                </ULink>
              </template>
              <div v-if="pageProperties.printouts['Page description'].length > 0">
                {{ pageProperties.printouts['Page description'][0] }}
              </div>
              <div v-if="pageProperties.printouts['Page keywords'].length > 0">
                Keywords:
                <i class="font-light">{{ pageProperties.printouts['Page keywords'].join(', ') }}</i>
              </div>
            </UPageCard>
          </div>
        </TransitionGroup>
      </UScrollArea>
    </div>
  </div>
</template>

<style scoped>
  .v-move,
  .v-enter-active,
  .v-leave-active {
    transition: all 0.5s ease;
  }

  .v-enter-from,
  .v-leave-to {
    opacity: 0;
  }

  .v-leave-active {
    position: absolute;
  }
</style>
