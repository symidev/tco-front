import {parseJwt} from '@/lib/utils';

export default {
    setToken(state, token) {
        state.token = token
        localStorage.setItem('token', token)
        if (token) {
            const jwtInfo = parseJwt(token);
            localStorage.setItem('tokenInfo', JSON.stringify(jwtInfo))
            state.tokenInfo = jwtInfo;
        } else {
            localStorage.setItem('tokenInfo', null)
            state.tokenInfo = null;
        }
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
    updateTokenDrupalDefaults(state, { field_is, field_charge_patronale }) {
        if (state.tokenInfo?.drupal) {
            state.tokenInfo.drupal.isDefault = field_is
            state.tokenInfo.drupal.chargePatronaleDefault = field_charge_patronale
            localStorage.setItem('tokenInfo', JSON.stringify(state.tokenInfo))
        }
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
