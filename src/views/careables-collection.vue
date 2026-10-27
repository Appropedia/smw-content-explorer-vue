<script setup>
  import { computed } from 'vue'
  import { useQuery } from '@pinia/colada'
  import { askActionQuery } from '@/queries/semantic-mediawiki.js'
  import { removePageNamePrefix, sortResults } from '@/helpers/semantic-mediawiki.js'
  import { useCareablesThumbnails } from '@/composables/useCareablesThumbnails.js'

  //Query used for obtaining all page data
  const { state: EDDIYQueryState } = useQuery(
    () => askActionQuery(
      'https://www.appropedia.org/w/api.php',
      {
        conditions: '[[~EDDIY/*]]',
        printouts: ['Page description', 'Page keywords'],
        parameters: { limit: 10000 },
      }
    )
  )

  //Sort the results in the query by page name and remove their prefixes
  const EDDIYQueryData = computed(() => {
    return sortResults(removePageNamePrefix(EDDIYQueryState.value.data, ''))
  })

  //Obtain the thumbnails of all pages in this view
  const pageThumbnails = useCareablesThumbnails()

  //UI configuration for the page hero element
  const pageHeroUIConfig = {
    container: 'bg-[#4d68c8] py-0 sm:py-0 lg:py-0',
    header: 'flex flex-col items-center',
    headline: 'w-100 sm:w-150 lg:w-150',
    title: 'text-white',
    description: 'text-white',
  }
</script>

<template>
  <UPageHero :ui="pageHeroUIConfig">
    <template #headline>
      <img src="@/assets/images/careables-collection/logo.svg">
    </template>
    <template #title>
      Design for care collection
    </template>
    <template #description>
      Careables is an open and inclusive approach to healthcare for citizens based on digital
      fabrication, distributed manufacturing and collaborative making.
    </template>
  </UPageHero>
  <UEmpty v-if="EDDIYQueryState.status === 'pending'" loading title="Loading" />
  <UEmpty v-else-if="EDDIYQueryState.status === 'error'" icon="i-lucide-circle-x"
    title="Error loading EDDIY pages" :description="EDDIYQueryState.error"
  />
  <UPageGrid v-else-if="EDDIYQueryState.status === 'success'" class="py-4"
    :ui="{ base: 'gap-4' }"
  >
    <UPageCard v-for="(pageProperties, pageName) in EDDIYQueryData.results" :key="pageName" reverse
      :title="pageName" :description="pageProperties.printouts['Page description'][0]"
      :to="pageProperties.fullurl" target="_blank"
    >
      <img v-if="Object.keys(pageThumbnails).includes(pageName)" :src="pageThumbnails[pageName]"
        class="mx-auto"
      >
      <UEmpty v-else loading />
      <template #footer>
        Keywords:
        <i class="font-light">{{ pageProperties.printouts['Page keywords'].join(', ') }}</i>
      </template>
    </UPageCard>
  </UPageGrid>
</template>
