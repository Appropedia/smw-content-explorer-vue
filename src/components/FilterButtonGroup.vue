<!--
  This component wraps a Nuxt UI's grouped button component (CheckboxGroup or RadioGroup), adding
  filter functionality via the result filter store. All attributes are passed directly to the child,
  allowing the client to specify them directly, in particular the 'items' attribute which is used to
  populate it.
-->
<script setup>
  import { computed } from 'vue'
  import { onBeforeRouteLeave } from 'vue-router'
  import { useResultFiltersStore } from '@/stores/result-filters.js'

  const props = defineProps({
    filterName: String,   //Filter identifier (SMW property name)
    buttonType: {         //The button type ('checkbox' or 'radio')
      type: String,
      default: 'checkbox',
    },
  })

  const resultFilters = useResultFiltersStore()

  //Set the applied filter values to empty in the store upon component creation
  resultFilters.applied[props.filterName] = []

  //Update the applied filter values in the store whenever the user modifies them
  const appliedFilters = computed({
    //The result filters store value is expected to be always an array of strings. This happens
    //automatically when the button type is set to 'checkbox', as the type of the model value of
    //UCheckboxGroup is the same; but adjustments are needed when the button type is set to 'radio',
    //as the type of the model value of URadioGroup is a single string.
    get: () => {
      switch (props.buttonType) {
        case 'checkbox':
          return resultFilters.applied[props.filterName]
        case 'radio':
          return resultFilters.applied[props.filterName]?.[0]
        default:
          throw new Error(`Invalid value for button type: ${props.buttonType}`)
      }
    },
    set: (newValue) => {
      switch (props.buttonType) {
        case 'checkbox':
          resultFilters.applied[props.filterName] = newValue
          break
        case 'radio':
          resultFilters.applied[props.filterName] = [newValue]
          break
      }
    },
  })

  //Remove the applied filter values from the store upon leaving the router view
  onBeforeRouteLeave(() => {
    delete resultFilters.applied[props.filterName]
  })
</script>

<template>
  <UCheckboxGroup v-if="props.buttonType === 'checkbox'" v-bind="$attrs" v-model="appliedFilters" />
  <URadioGroup v-else-if="props.buttonType === 'radio'" v-bind="$attrs" v-model="appliedFilters" />
</template>
