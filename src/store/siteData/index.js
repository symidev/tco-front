import { siteDataService } from '@/services/api/siteDataService'

export default {
  namespaced: true,

  state: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  },

  getters: {
    // Récupère les données brutes
    getData(state) {
      return state.data
    },

    // Permet d'accéder à des données imbriquées via des clés passées en paramètres
    getNestedData: (state) => (...keys) => {
      if (!state.data) return null

      let result = state.data

      for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
          result = result[key]
        } else {
          return null
        }
      }

      return result
    },

    isLoading(state) {
      return state.loading
    },

    hasError(state) {
      return state.error !== null
    },

    getError(state) {
      return state.error
    }
  },

  mutations: {
    SET_DATA(state, data) {
      state.data = data
      state.lastUpdated = Date.now()
    },

    SET_LOADING(state, status) {
      state.loading = status
    },

    SET_ERROR(state, error) {
      state.error = error
    },

    RESET_DATA(state) {
      state.data = null
      state.error = null
    }
  },

  actions: {
    // Récupère les données depuis l'API
    async fetchSiteData({ commit, rootGetters }) {
      // Vérifier si l'utilisateur est connecté
      const isAuthenticated = rootGetters['auth/isAuthenticated']

      if (!isAuthenticated) {
        commit('SET_ERROR', 'Utilisateur non authentifié')
        return false
      }

      commit('SET_LOADING', true)
      commit('SET_ERROR', null)

      try {
        const response = await siteDataService.getShareData()
        commit('SET_DATA', response.data)
        commit('SET_LOADING', false)
        return true
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Erreur lors de la récupération des données')
        commit('SET_LOADING', false)
        return false
      }
    },

    // Récupère les données si elles n'existent pas encore ou si elles sont périmées
    async getSiteDataIfNeeded({ state, dispatch, rootGetters }) {
      const isAuthenticated = rootGetters['auth/isAuthenticated']

      // Vérifier si les données sont périmées (plus de 5 minutes)
      const dataTimestamp = state.lastUpdated || 0
      const isDataStale = Date.now() - dataTimestamp > 5 * 60 * 1000

      if (isAuthenticated && (!state.data || isDataStale) && !state.loading) {
        return await dispatch('fetchSiteData')
      }

      return !!state.data
    },

    // Réinitialise les données
    resetData({ commit }) {
      commit('RESET_DATA')
    }
  }
}
