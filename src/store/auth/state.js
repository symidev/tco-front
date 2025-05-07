export default {
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    tokenInfo: localStorage.getItem('tokenInfo') ? JSON.parse(localStorage.getItem('tokenInfo')) : null,
    user: null,
    error: null,
    loading: false,
    isAutoConnect: localStorage.getItem('isAutoConnect') === 'true'
}
