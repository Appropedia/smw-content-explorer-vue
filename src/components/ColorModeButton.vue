<!--
  This component provides a simple color mode button that allows to switch between light and dark
  themes.
-->
<script setup>
  import { useColorMode } from '@vueuse/core'

  const colorMode = useColorMode()
</script>

<template>
  <UButton
    :icon="colorMode === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
    variant="ghost"
    @click="colorMode = colorMode === 'dark'? 'light': 'dark'"
  />
</template>
