<!--
  This component provides a view that lists sub pages of TissueDB/Tissues, allowing to filter pages
  by the 'Page keywords' semantic property.
-->
<script setup>
  import { computed } from 'vue'
  import { useQuery } from '@pinia/colada'
  import { askQuery } from '@/queries/semantic-mediawiki.js'
  import { countPrintoutValues }  from '@/helpers/semantic-mediawiki.js'
  import FilterButtonGroup from '@/components/FilterButtonGroup.vue'
  import PageResultTransitionGroup from '@/components/PageResultTransitionGroup.vue'

  //Query used for obtaining all page data
  const { state: tissueDBQueryState } = useQuery(
    () => askQuery(
      'https://www.appropedia.org/w/api.php',
      {
        conditions: '[[~TissueDB/Tissues/*]]',
        printouts: ['Page description', 'Page keywords'],
      },
    )
  )

  //Populate the filter radio button group with all values of the 'Page keywords' property that are
  //present in the page data
  const radioButtonItems = computed(() => {
    if (tissueDBQueryState.value.data === undefined)
      return []   //Data not ready yet

    const printoutCounts = countPrintoutValues(tissueDBQueryState.value.data)['Page keywords']

    return Object.entries(printoutCounts).map(([propertyValue, valueCount]) =>
      ({
        label: `${propertyValue} (${valueCount})`,
        value: propertyValue,
      })
    )
  })
</script>

<template>
  <div class="flex flex-col h-full">
    <UPageHeader title="Tissues Explorer" />
    <div v-if="tissueDBQueryState.status === 'pending'">
      Loading...
    </div>
    <div v-else-if="tissueDBQueryState.status === 'error'">
      Error loading allowed values for Page SDG <br>
      {{ tissueDBQueryState.error }}
    </div>
    <div v-else-if="tissueDBQueryState.status === 'success'"
      class="min-h-0 grow flex flex-row gap-4"
    >
      <UScrollArea class="shrink-0">
        <FilterButtonGroup filter-name="Page keywords" button-type="radio" :items="radioButtonItems"
          legend="Keywords" variant="card"
        />
      </UScrollArea>
      <UScrollArea class="grow" :ui="{ viewport: 'p-px' }">
        <PageResultTransitionGroup :query-data="tissueDBQueryState.data"
          :merge-rules="{ 'Page keywords': 'disjunction' }"
        >
          <template #when-empty>Select a keyword</template>
          <template #default="{ pageName, pageProperties }">
            <UPageCard>
              <template #title>
                <ULink :to="pageProperties.fullurl" active external target="_blank">
                  {{ pageName }}
                </ULink>
              </template>
              <div> {{ pageProperties.printouts['Page description'][0] }} </div>
              <div>
                Keywords:
                <i>{{ pageProperties.printouts['Page keywords'].join(', ') }}</i>
              </div>
            </UPageCard>
          </template>
        </PageResultTransitionGroup>
      </UScrollArea>
    </div>
  </div>
</template>
