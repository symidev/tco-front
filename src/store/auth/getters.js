export default {
  isAuthenticated: state => !!state.token,
  getToken: state => state.token,
  getRefreshToken: state => state.refreshToken,
  getUser: state => state.user,
  getError: state => state.error,
  isLoading: state => state.loading
}