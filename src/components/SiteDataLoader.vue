<template>
  <div v-if="loading" class="site-data-loader">
    <slot name="loading">
      <p class="text-sm text-gray-500">Chargement des données du site...</p>
    </slot>
  </div>
  <div v-else-if="error" class="site-data-error">
    <slot name="error" :error="error">
      <p class="text-sm text-red-500">{{ error }}</p>
    </slot>
  </div>
  <div v-else class="site-data-content">
    <slot></slot>
  </div>
</template>

<script>
import { defineComponent, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'SiteDataLoader',

  setup() {
    const store = useStore()

    const loading = computed(() => store.getters['siteData/isLoading'])
    const error = computed(() => store.getters['siteData/hasError'] ? store.getters['siteData/getError'] : null)

    onMounted(async () => {
      await store.dispatch('siteData/getSiteDataIfNeeded')
    })

    return {
      loading,
      error
    }
  }
})
</script>
