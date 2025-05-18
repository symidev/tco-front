import { computed } from 'vue'
import { useStore } from 'vuex'
import { siteDataService } from '@/services/api/siteDataService'

export function useSiteData() {
  const store = useStore()

  const data = computed(() => store.getters['siteData/getData'])
  const loading = computed(() => store.getters['siteData/isLoading'])
  const error = computed(() => store.getters['siteData/hasError'] ? store.getters['siteData/getError'] : null)

  const getNestedData = (...keys) => computed(() => store.getters['siteData/getNestedData'](...keys))

  const fetchSiteData = async () => {
    return await store.dispatch('siteData/fetchSiteData')
  }

  const getSiteDataIfNeeded = async () => {
    return await store.dispatch('siteData/getSiteDataIfNeeded')
  }

  const resetSiteData = () => {
    store.dispatch('siteData/resetData')
  }

  // Accès direct au service si nécessaire
  const siteData = {
    service: siteDataService
  }

  return {
    data,
    loading,
    error,
    getNestedData,
    fetchSiteData,
    getSiteDataIfNeeded,
    resetSiteData,
    siteData
  }
}
