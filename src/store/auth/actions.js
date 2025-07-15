import { apiClient } from '@/lib/utils'

export default {
  async login({ commit }, { login, password }) {
    try {
      commit('setLoading', true)
      commit('setError', null)

      const authHeader = 'Basic ' + btoa(`${login}:${password}`)

      const response = await apiClient.post(`/jwt/token`, {}, {
        headers: {
          Authorization: authHeader
        }
      })

      const { token, refresh_token } = response.data

      // Vérifier les rôles de l'utilisateur
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]))
        const roles = tokenData.drupal?.roles || []
        
        // Vérifier si l'utilisateur a au moins un des rôles requis
        const hasValidRole = roles.includes('comparo') || roles.includes('catalogue')
        
        if (!hasValidRole) {
          return { 
            success: false, 
            error: 'Aucun abonnement actif trouvé. Veuillez contacter l\'administrateur.',
            noSubscription: true 
          }
        }
      } catch (tokenError) {
        console.error('Erreur lors de la vérification des rôles:', tokenError)
        return { 
          success: false, 
          error: 'Erreur lors de la vérification de l\'abonnement. Veuillez réessayer.',
          noSubscription: true 
        }
      }

      commit('setToken', token)
      commit('setRefreshToken', refresh_token)

      return { success: true }
    } catch (error) {
      commit('setError', error.response?.data?.message || 'Échec de connexion')
      return { success: false, error: error.response?.data?.message || 'Échec de connexion' }
    } finally {
      commit('setLoading', false)
    }
  },

  async autoConnect({ commit }, { token }) {
    try {
      commit('setLoading', true)
      commit('setError', null)

      const response = await apiClient.get(`/jwt/refreshByJwt`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const { token: accessToken, refresh_token } = response.data

      commit('setToken', accessToken)
      commit('setRefreshToken', refresh_token)
      commit('setIsAutoConnect', true)

      return { success: true }
    } catch (error) {
      commit('setError', error.response?.data?.message || 'Échec de connexion automatique')
      return { success: false, error: error.response?.data?.message || 'Échec de connexion automatique' }
    } finally {
      commit('setLoading', false)
    }
  },

  async refreshToken({ commit, dispatch, state }) {
      try {
        const response = await apiClient.post(`/jwt/refresh`, {
          refresh_token: state.refreshToken
        })

        const { token, refresh_token } = response.data

        commit('setToken', token)
        commit('setRefreshToken', refresh_token)

      return { success: true }
    } catch (error) {
      commit('clearAuth')
      return { success: false, error: error.response?.data?.message || 'Échec du rafraîchissement du token' }
    }
  },

  async forgotPassword({ commit }, { email }) {
    try {
      commit('setLoading', true)
      commit('setError', null)

      await apiClient.post(`/api/user/forget`, { email })

      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Échec de la demande de réinitialisation'
      commit('setError', errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      commit('setLoading', false)
    }
  },

  logout({ commit }) {
    commit('clearAuth')
  }
}
