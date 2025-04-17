import axios from 'axios'

const API_URL = import.meta.env.VITE_API_BASE_URL

export default {
  async login({ commit }, { login, password }) {
    try {
      commit('setLoading', true)
      commit('setError', null)
      
      const authHeader = 'Basic ' + btoa(`${login}:${password}`)
      
      const response = await axios.post(`${API_URL}/jwt/token`, {}, {
        headers: {
          Authorization: authHeader
        }
      })
      
      const { token, refresh_token } = response.data
      
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
  
  async refreshToken({ commit, state }) {
    try {
      const response = await axios.post(`${API_URL}/jwt/refresh`, {
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
      
      await axios.post(`${API_URL}/api/user/forget`, { email })
      
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