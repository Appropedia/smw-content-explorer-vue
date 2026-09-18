<!--
  This component provides a view that lists pages in the 'Fab_lab_profile' category, allowing to
  filter pages by the 'Page SDG' semantic property.
-->
<script setup>
  import { computed } from 'vue'
  import { useQuery } from '@pinia/colada'
  import { askQuery } from '@/queries/semantic-mediawiki.js'
  import { getAllowedValues }  from '@/helpers/semantic-mediawiki.js'
  import FilterButtonGroup from '@/components/FilterButtonGroup.vue'
  import PageResultTransitionGroup from '@/components/PageResultTransitionGroup.vue'

  //Query used for populating the filter list
  const { state: pageSDGQueryState } = useQuery(
    () => askQuery(
      'https://www.appropedia.org/w/api.php',
      {
        conditions: '[[Property:Page SDG]]',
        printouts: ['Allows value'],
      },
    )
  )

  //Query used for populating the page results
  const { state: fabLabQueryState } = useQuery(
    () => askQuery(
      'https://www.appropedia.org/w/api.php',
      {
        conditions: '[[Category:Fab_lab_profile]]',
        printouts: ['Page SDG', 'Organization area'],
      },
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
</script>

<template>
  <div class="flex flex-col h-full">
    <UPageHeader title="Fablabs by Sustainable Development Goals" />
    <div class="min-h-0 grow flex flex-row gap-4">
      <div v-if="pageSDGQueryState.status === 'pending'" class="simple-panel">
        Loading...
      </div>
      <div v-else-if="pageSDGQueryState.status === 'error'" class="simple-panel">
        Error loading allowed values for Page SDG <br>
        {{ pageSDGQueryState.error }}
      </div>
      <UScrollArea v-else-if="pageSDGQueryState.status === 'success'">
        <FilterButtonGroup filter-name="Page SDG" :items="filterButtonListItems"
          legend="Sustainable Development Goals" variant="card"
        />
      </UScrollArea>

      <div v-if="fabLabQueryState.status === 'pending'" class="simple-panel">
        Loading...
      </div>
      <div v-else-if="fabLabQueryState.status === 'error'" class="simple-panel">
        Error loading fablab pages <br>
        {{ fabLabQueryState.error }}
      </div>
      <UScrollArea v-else-if="fabLabQueryState.status === 'success'" class="grow"
        :ui="{ viewport: 'p-px' }"
      >
        <PageResultTransitionGroup :query-data="fabLabQueryState.data"
          v-slot="{ pageName, pageProperties }"
        >
          <UPageCard>
            <template #title>
              <ULink :to="pageProperties.fullurl" active external target="_blank">
                {{ pageName }}
              </ULink>
            </template>
            Organization area: {{ pageProperties.printouts['Organization area'][0] }}
            <div>
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
