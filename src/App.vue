<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ColorModeButton from './components/ColorModeButton.vue'

  const sidebarOpen = ref(true)

  const navMenuItems = useRouter().getRoutes().filter(v => v.name).map((v) => ({
    label: v.name,
    to: { name: v.name },
  }))
</script>

<template>
  <UApp>
    <div class="flex flex-1">
      <USidebar
        variant="floating"
        v-model:open="sidebarOpen"
        :close="{ color: 'primary' }"
        :style="{ '--sidebar-width': '24rem' }"
      >
        <template #title>
          Exploration Topics
        </template>
        <UNavigationMenu :items="navMenuItems" orientation="vertical" />
      </USidebar>
      <div class="flex flex-1 flex-col">
        <div class="h-(--ui-header-height) flex justify-between border-b border-default px-4">
          <UButton
            v-if="!sidebarOpen"
            icon="i-lucide-panel-left"
            variant="ghost"
            aria-label="Toggle sidebar"
            @click="sidebarOpen = !sidebarOpen"
          />
          <ColorModeButton class="ml-auto" />
        </div>
        <RouterView />
      </div>
    </div>
  </UApp>
</template>

<style scoped></style>
