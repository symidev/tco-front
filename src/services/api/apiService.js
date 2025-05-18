import axios from 'axios';
import router from '@/router';
import store from '@/store';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Création d'une instance axios pour les services
const apiService = axios.create({
    baseURL: API_URL
});

// Fonction commune pour identifier les routes d'authentification
const isAuthRoute = (url) => url.includes('/jwt/token') || url.includes('/jwt/refresh');

// Configuration des intercepteurs de requête
apiService.interceptors.request.use(
    config => {
        // Ne pas ajouter le token pour les routes d'authentification
        if (!isAuthRoute(config.url)) {
            // Récupérer le token depuis le store
            const token = store.state.auth.token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    error => Promise.reject(error)
);

// Configuration des intercepteurs de réponse pour gérer les erreurs 403
apiService.interceptors.response.use(
    response => response,
    async error => {
        // Vérifier si l'erreur est 403 et que ce n'est pas déjà une tentative de refresh
        if (error.response?.status === 403 && !error.config._isRetry) {
            // Ne pas tenter de rafraîchir si c'est une route d'authentification
            if (!isAuthRoute(error.config.url)) {
                // Vérifier si un refresh token existe dans le store
                const refreshToken = store.getters['auth/getRefreshToken'];

                // Si un refresh token existe, tenter de rafraîchir
                if (refreshToken) {
                    try {
                        error.config._isRetry = true;

                        // Utiliser l'action du store pour rafraîchir le token
                        const refreshResult = await store.dispatch('auth/refreshToken');

                        if (refreshResult.success) {
                            // Réessayer la requête originale avec le nouveau token
                            error.config.headers.Authorization = `Bearer ${store.state.auth.token}`;
                            return apiService(error.config);
                        } else {
                            throw new Error(refreshResult.error || 'Échec du rafraîchissement');
                        }
                    } catch (refreshError) {
                        // Si le refresh échoue, le store a déjà nettoyé l'authentification via clearAuth
                        return Promise.reject(refreshError);
                    }
                }
            }
        } else if (error.response?.status === 403 && error.config._isRetry) {
            // Si déjà une tentative de refresh qui a échoué, rediriger vers login
            store.commit('auth/clearAuth');
            router.push({
                path: '/login',
                query: {reason: 'se'}
            });
        }
        return Promise.reject(error);
    }
);

export default apiService;
