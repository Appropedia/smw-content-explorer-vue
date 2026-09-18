<!--
  This component provides a means for rendering the results of a Semantic Mediawiki API response,
  providing the following features:
  - Filtering via the result filter store.
  - Formatting of individual page results via a single slot.
  - Animation of filtered results via TransitionGroup animations, in response to filter selection
    actions from the user.
-->
<script setup>
  import { computed } from 'vue'
  import { useResultFiltersStore } from '@/stores/result-filters.js'
  import { getPrintoutValues, checkFilters } from '@/helpers/semantic-mediawiki.js'

  const props = defineProps({
    queryData: Object,    //Response data provided by the Semantic Mediawiki API
    mergeRules: Object,   //Merging rules (see the checkFilters function)
  })

  const resultFilters = useResultFiltersStore()

  //Obtain the printout values from API response data
  const printoutValues = computed(() => getPrintoutValues(props.queryData))

  //Filtered pages are taken directly from the API response data by applying the filter rules
  const filteredPages = computed(
    () => Object.fromEntries(
      Object.entries(props.queryData.results).filter(
        ([pageName,]) => checkFilters(printoutValues.value[pageName], resultFilters.applied,
                                      props.mergeRules)
      )
    )
  )
</script>

<template>
  <slot name="when-empty" v-if="Object.keys(filteredPages).length === 0" />
  <TransitionGroup v-else tag="div" class="flex flex-col gap-2">
    <div v-for="(pageProperties, pageName) in filteredPages" :key="pageName">
      <slot :page-name="pageName" :page-properties="pageProperties" />
    </div>
  </TransitionGroup>
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
