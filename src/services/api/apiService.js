import axios from 'axios';
import router from '@/router';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Création d'une instance axios pour les services indépendante du store
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
            // Récupérer le token depuis localStorage
            const token = localStorage.getItem('token');
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
                const refreshToken = localStorage.getItem('refreshToken');

                // Si un refresh token existe, tenter de rafraîchir
                if (refreshToken) {
                    try {
                        error.config._isRetry = true;

                        // Appel pour rafraîchir le token
                        const response = await axios.post(`${API_URL}/jwt/refresh`, {
                            refresh_token: refreshToken
                        });

                        // Stocker le nouveau token
                        if (response.data.token) {
                            localStorage.setItem('token', response.data.token);
                            localStorage.setItem('refreshToken', response.data.refresh_token);

                            // Réessayer la requête originale avec le nouveau token
                            error.config.headers.Authorization = `Bearer ${response.data.token}`;
                            return apiService(error.config);
                        }
                    } catch (refreshError) {
                        // Si le refresh échoue, nettoyer l'authentification
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                        return Promise.reject(refreshError);
                    }
                } else {
                    // Si pas de refresh token, nettoyer l'authentification
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                }
            }
        } else if (error.response?.status === 403 && error.config._isRetry) {
            // Si déjà une tentative de refresh qui a échoué, rediriger vers login
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            router.push({
                path: '/login',
                query: {reason: 'se'}
            });
        }
        return Promise.reject(error);
    }
);

export default apiService;
