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
  import FilterButtonGroup from '@/components/FilterButtonGroup.vue'
  import PageResultTransitionGroup from '@/components/PageResultTransitionGroup.vue'

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
        conditions: '[[Category:Fab_lab_profile]] [[Page parent::Fab Labs SDG]]',
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
</script>

<template>
  <div class="flex flex-col h-full">
    <UPageHeader title="Fab labs by Sustainable Development Goals" />
    <div class="min-h-0 grow flex flex-row gap-4">
      <div v-if="pageSDGQueryState.status === 'pending'" class="simple-panel">
        Loading...
      </div>
      <div v-else-if="pageSDGQueryState.status === 'error'" class="simple-panel">
        Error loading allowed values for Page SDG <br>
        {{ pageSDGQueryState.error }}
      </div>
      <UScrollArea v-else-if="pageSDGQueryState.status === 'success'" class="shrink-0">
        <FilterButtonGroup filter-name="Page SDG" :items="filterButtonListItems"
          legend="Sustainable Development Goals" variant="card"
        />
      </UScrollArea>

      <div v-if="fabLabQueryState.status === 'pending'" class="simple-panel">
        Loading...
      </div>
      <div v-else-if="fabLabQueryState.status === 'error'" class="simple-panel">
        Error loading fab lab pages <br>
        {{ fabLabQueryState.error }}
      </div>
      <UScrollArea v-else-if="fabLabQueryState.status === 'success'" class="grow"
        :ui="{ viewport: 'p-px' }"
      >
        <PageResultTransitionGroup :query-data="fabLabQueryData"
          v-slot="{ pageName, pageProperties }"
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
        </PageResultTransitionGroup>
      </UScrollArea>
    </div>
  </div>
</template>

<style scoped>
  @reference "tailwindcss";

  .simple-panel {
    @apply grow border rounded-md p-2;
    border-color: var(--ui-border);
  }
</style>
