export default {
  isAuthenticated: state => !!localStorage.getItem('token'),
  getToken: state => localStorage.getItem('token') || null,
  getTokenInfo: state => state.tokenInfo,
  getRefreshToken: state => localStorage.getItem('refreshToken') || null,
  getUser: state => state.user,
  getError: state => state.error,
  isLoading: state => state.loading
}
