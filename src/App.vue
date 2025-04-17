<script setup>
import { RouterView } from 'vue-router'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NoAuthLayout from '@/layouts/NoAuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
const layouts = {
  NoAuthLayout
}

const route = useRoute()
const layout = computed(() => layouts[route.meta.layout] || DefaultLayout)
</script>
<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>
