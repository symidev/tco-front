import {createRouter, createWebHistory} from 'vue-router'
import LoginView from '../views/auth/LoginView.vue'
import Registerview from '../views/auth/RegisterView.vue'
import ForgetPasswordView from '../views/auth/ForgetPasswordView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            meta: {layout: 'NoAuthLayout', requiresAuth: false}
        },
        {
            path: '/register',
            name: 'register',
            component: Registerview,
            meta: {layout: 'NoAuthLayout', requiresAuth: false}
        },
        {
            path: '/forget-password',
            name: 'forget-password',
            component: ForgetPasswordView,
            meta: {layout: 'NoAuthLayout', requiresAuth: false}
        }
    ],
})

export default router
