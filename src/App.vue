<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'

const authStore = useAuthStore()
onMounted(() => {
  authStore.hydrate()
})
</script>

<template>
  <RouterView />
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  max-width: 100%;
}
#app {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  max-width: 100%;
}
</style>
<style scoped></style>
