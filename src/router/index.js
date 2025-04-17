import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/auth/LoginView.vue'
import Registerview from '../views/auth/RegisterView.vue'
import ForgetPasswordView from '../views/auth/ForgetPasswordView.vue'
import HomeView from '../views/HomeView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            meta: { layout: 'NoAuthLayout', requiresAuth: false }
        },
        {
            path: '/register',
            name: 'register',
            component: Registerview,
            meta: { layout: 'NoAuthLayout', requiresAuth: false }
        },
        {
            path: '/forget-password',
            name: 'forget-password',
            component: ForgetPasswordView,
            meta: { layout: 'NoAuthLayout', requiresAuth: false }
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: NotFoundView,
            meta: { requiresAuth: false }
        }
    ],
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    
    // Définir le layout pour la page 404 en fonction de l'authentification
    if (to.name === 'not-found') {
        to.meta.layout = token ? 'DefaultLayout' : 'NoAuthLayout'
    }
    
    // Si la route nécessite une authentification et que l'utilisateur n'est pas connecté
    if (to.meta.requiresAuth && !token) {
        next({ name: 'login' })
    }
    // Si l'utilisateur est connecté et essaie d'accéder à une page de connexion
    else if (token && to.path === '/login') {
        next({ name: 'home' })
    }
    // Dans tous les autres cas
    else {
        next()
    }
})

export default router