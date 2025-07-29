import { apiClient } from '@/lib/utils'

export default {
  async fetchUserProfile({ commit }) {
    try {
      commit('setLoading', true)
      commit('setError', null)

      const response = await apiClient.get('/api/user')

      commit('setUser', response.data)
      return { success: true, data: response.data }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Échec de récupération du profil utilisateur'
      commit('setError', errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      commit('setLoading', false)
    }
  },

  async updateUserProfile({ commit }, userData) {
    try {
      commit('setLoading', true)
      commit('setError', null)

      const isFormData = userData instanceof FormData
      
      const config = {
        method: 'post',
        url: '/api/user/update',
      }
      
      if (isFormData) {
        // For FormData, let axios set the Content-Type automatically
        config.data = userData
      } else {
        // For JSON data
        config.headers = {
          'Content-Type': 'application/vnd.api+json'
        }
        config.data = JSON.stringify(userData)
      }

      const response = await apiClient(config)

      // Update local user data with the changes
      if (isFormData) {
        // For FormData, iterate through entries
        for (const [key, value] of userData.entries()) {
          if (key.startsWith('field_')) {
            commit('updateUserField', { field: key, value })
          }
        }
      } else {
        // For regular object
        for (const [key, value] of Object.entries(userData)) {
          const fieldName = key.startsWith('field_') ? key : `field_${key}`
          commit('updateUserField', { field: fieldName, value })
        }
      }

      return { success: true, data: response.data }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Échec de la mise à jour du profil'
      commit('setError', errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      commit('setLoading', false)
    }
  },

  async changePassword({ commit }, { currentPassword, newPassword }) {
    try {
      commit('setLoading', true)
      commit('setError', null)

      await apiClient({
        method: 'patch',
        url: '/api/change-password',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        data: JSON.stringify({
          oldpassword: currentPassword,
          newpassword: newPassword
        })
      })

      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Échec du changement de mot de passe'
      commit('setError', errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      commit('setLoading', false)
    }
  },
  
  async changePasswordAfterAutoConnect({ commit }, { newPassword }) {
    try {
      commit('setLoading', true)
      commit('setError', null)

      await apiClient({
        method: 'patch',
        url: '/api/change-password/reset',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        data: JSON.stringify({
          newpassword: newPassword
        })
      })

      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Échec du changement de mot de passe'
      commit('setError', errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      commit('setLoading', false)
    }
  }
}
