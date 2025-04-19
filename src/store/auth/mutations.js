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
  setIsAutoConnect(state, isAutoConnect) {
    state.isAutoConnect = isAutoConnect
    localStorage.setItem('isAutoConnect', isAutoConnect)
  },
  clearAuth(state) {
    state.token = null
    state.refreshToken = null
    state.user = null
    state.isAutoConnect = false
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('isAutoConnect')
  }
}