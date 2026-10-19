<!--
  This component provides a view that lists pages in the 'Fab_lab_profile' category, allowing to
  filter pages by the 'Page SDG' semantic property.
-->
<script setup>
  import { computed } from 'vue'
  import { useQuery } from '@pinia/colada'
  import { askQuery } from '@/queries/semantic-mediawiki.js'
  import {
    getAllowedValues, removePageNamePrefix, sortResults
  }  from '@/helpers/semantic-mediawiki.js'
  import { useFilteredPages } from '@/composables/useFilteredPages.js'
  import FilterButtonGroup from '@/components/FilterButtonGroup.vue'

  //Query used for populating the filter list
  const { state: pageSDGQueryState } = useQuery(
    () => askQuery(
      'https://www.appropedia.org/w/api.php',
      {
        conditions: '[[Property:Page SDG]]',
        printouts: ['Allows value'],
      }
    )
  )

  //Query used for populating the page results
  const { state: fabLabQueryState } = useQuery(
    () => askQuery(
      'https://www.appropedia.org/w/api.php',
      {
        conditions: '[[Category:Fab Labs SDG]] ' +    //Base category
                    '[[Organization type::+]] ' +     //Only pages that describe an organization
                    '[[Page parent::Fab Labs SDG]]',  //Exclude child pages (translations)
        printouts: ['Page description', 'Page SDG', 'Organization area'],
        parameters: { limit: 10000 },
      }
    )
  )

  //Populate the filter checkbox group with all allowed values of the 'Page SDG' property
  const filterButtonListItems = computed(() => {
    if (pageSDGQueryState.value.data === undefined)
      return []   //Data not ready yet

    const values = getAllowedValues(pageSDGQueryState.value.data)['Page SDG']

    return values.map((v) => ({
      value: v,
      label: v.split(' ')[0],
      description: v.slice(v.indexOf(' ') + 1),
    }))
  })

  //Sort the results in the fab lab query by page name and remove their prefixes
  const fabLabQueryData = computed(() => {
    return sortResults(removePageNamePrefix(fabLabQueryState.value.data, 'Fab Labs SDG/'))
  })

  //Create a reactive list of filtered pages from the query data
  const filteredPages = useFilteredPages(fabLabQueryData)
</script>

<template>
  <div class="flex flex-col h-full">
    <UPageHeader title="Fab labs by Sustainable Development Goals" />
    <div class="min-h-0 grow flex flex-row gap-4">
      <UEmpty v-if="pageSDGQueryState.status === 'pending'" loading title="Loading" />
      <UEmpty v-else-if="pageSDGQueryState.status === 'error'" icon="i-lucide-circle-x"
        title="Error loading allowed values for Page SDG" :description="pageSDGQueryState.error"
      />
      <UScrollArea v-else-if="pageSDGQueryState.status === 'success'" class="shrink-0">
        <FilterButtonGroup filter-name="Page SDG" :items="filterButtonListItems"
          legend="Sustainable Development Goals" variant="card"
        />
      </UScrollArea>

      <UEmpty v-if="fabLabQueryState.status === 'pending'" loading title="Loading" class="grow" />
      <UEmpty v-else-if="fabLabQueryState.status === 'error'" icon="i-lucide-circle-x" class="grow"
        title="Error loading fab lab pages" :description="fabLabQueryState.error"
      />
      <UScrollArea v-else-if="fabLabQueryState.status === 'success'" class="grow p-px"
        :items="filteredPages"
        v-slot="{ item: { pageName, pageProperties } }"
        :virtualize="{ gap: 6, estimateSize: 240 }"
      >
        <UPageCard>
          <template #title>
            <ULink :to="pageProperties.fullurl" active external target="_blank">
              {{ pageName }}
            </ULink>
          </template>
          <div v-if="pageProperties.printouts['Page description'].length > 0">
            {{ pageProperties.printouts['Page description'][0] }}
          </div>
          <div v-if="pageProperties.printouts['Organization area'].length > 0">
            Organization area: {{ pageProperties.printouts['Organization area'][0] }}
          </div>
          <div v-if="pageProperties.printouts['Page SDG'].length > 0">
            <ULink v-for="sdg of pageProperties.printouts['Page SDG']" :key="sdg"
              :to="sdg.fullurl" active external target="_blank"
            >
              {{ sdg.fulltext.split(' ')[0] }} {{ ' ' }}
            </ULink>
          </div>
        </UPageCard>
      </UScrollArea>
    </div>
  </div>
</template>
