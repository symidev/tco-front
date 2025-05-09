import {clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';
import axios from 'axios';
import router from '@/router';
import {jwtDecode} from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function parseJwt(token) {
    return jwtDecode(token);
}

// Création d'une instance axios commune pour toute l'application
export const apiClient = axios.create({
    baseURL: API_URL
});

// Configuration des intercepteurs pour les requêtes qui nécessitent un token
export function setupApiInterceptors(store) {
    // Intercepteur de requête pour ajouter automatiquement le token
    apiClient.interceptors.request.use(
        config => {
            // Ne pas ajouter le token pour les routes d'authentification
            const isAuthRoute = config.url.includes('/jwt/token') || config.url.includes('/jwt/refresh');
            if (!isAuthRoute && store.state.auth.token) {
                config.headers.Authorization = `Bearer ${store.state.auth.token}`;
            }
            return config;
        },
        error => Promise.reject(error)
    );

    // Intercepteur de réponse pour gérer les erreurs 403
    apiClient.interceptors.response.use(
        response => response,
        async error => {
            // Vérifier si l'erreur est 403 et que ce n'est pas déjà une tentative de refresh
            console.log('error', error.config);
            if (error.response?.status === 403 && !error.config._isRetry) {
                console.log('first try');
                // Ne pas tenter de rafraîchir si c'est une route d'authentification
                const isAuthRoute = error.config.url.includes('/jwt/token') || error.config.url.includes('/jwt/refresh');

                // Si un refresh token existe, tenter de rafraîchir
                if (!isAuthRoute && store.state.auth.refreshToken) {
                    try {
                        error.config._isRetry = true;
                        await store.dispatch('auth/refreshToken');
                        // Réessayer la requête originale avec le nouveau token
                        return apiClient(error.config);
                    } catch (refreshError) {
                        // Si le refresh échoue, nettoyer l'authentification
                        store.commit('auth/clearAuth');
                        return Promise.reject(refreshError);
                    }
                } else {
                    // Si pas de refresh token, nettoyer l'authentification
                    store.commit('auth/clearAuth');
                }
            } else if (error.response?.status === 403 && error.config._isRetry) {
                console.log('second try');
                store.commit('auth/clearAuth');
                router.push({
                    path: '/login',
                    query: {reason: 'se'}
                });
            }
            return Promise.reject(error);
        }
    );
}
