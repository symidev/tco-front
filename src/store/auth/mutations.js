export default {
  setToken(state, token) {
    state.token = token
    localStorage.setItem('token', token)
  },
  setRefreshToken(state, refreshToken) {
    state.refreshToken = refreshToken
    localStorage.setItem('refreshToken', refreshToken)
  },
  setUser(state, user) {
    state.user = user
  },
  setError(state, error) {
    state.error = error
  },
  setLoading(state, loading) {
    state.loading = loading
  },
  clearAuth(state) {
    state.token = null
    state.refreshToken = null
    state.user = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }
}