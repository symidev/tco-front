export default {
  setUser(state, user) {
    state.user = user
  },
  setLoading(state, loading) {
    state.loading = loading
  },
  setError(state, error) {
    state.error = error
  },
  updateUserField(state, { field, value }) {
    if (state.user) {
      state.user[field] = value
    }
  }
}