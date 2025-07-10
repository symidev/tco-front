import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/auth/LoginView.vue'
import Registerview from '../views/auth/RegisterView.vue'
import ForgetPasswordView from '../views/auth/ForgetPasswordView.vue'
import HomeView from '../views/HomeView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import AccountLayout from '../views/account/AccountLayout.vue'
import UserProfile from '../components/user/UserProfile.vue'
import PasswordView from '../views/account/PasswordView.vue'

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
            path: '/vehicules',
            name: 'vehicules',
            component: () => import('../views/VehiculesView.vue'),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/catalogues',
            name: 'catalogues',
            component: () => import('../views/CataloguesView.vue'),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/catalogue/add',
            name: 'CatalogueAdd',
            component: () => import('../views/CatalogueForm.vue'),
            props: { mode: 'add' },
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/catalogue/:uuid',
            name: 'CatalogueEdit',
            component: () => import('../views/CatalogueForm.vue'),
            props: route => ({ mode: 'edit', uuid: route.params.uuid }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/catalogue/:uuid/categories',
            name: 'CatalogueCategories',
            component: () => import('../views/CatalogueDetailView.vue'),
            props: route => ({ uuid: route.params.uuid }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        // Routes catalogues avancées (Étapes 7-8 activées)
        {
            path: '/catalogue/:catalogueUuid/categories/add',
            name: 'CategorieAdd',
            component: () => import('../views/CategorieForm.vue'),
            props: route => ({ mode: 'add', catalogueUuid: route.params.catalogueUuid }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/catalogue/:catalogueUuid/categories/:categorieUuid',
            name: 'CategorieEdit',
            component: () => import('../views/CategorieForm.vue'),
            props: route => ({
                mode: 'edit',
                catalogueUuid: route.params.catalogueUuid,
                categorieUuid: route.params.categorieUuid
            }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/catalogue/:catalogueUuid/categories/:categorieUuid/vehicules',
            name: 'CategorieVehicules',
            component: () => import('../views/CategorieVehiculesView.vue'),
            props: route => ({ 
                catalogueUuid: route.params.catalogueUuid,
                categorieUuid: route.params.categorieUuid
            }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        // Routes véhicules pour catalogues (Étape 8 activée)
        {
            path: '/catalogue/:catalogueUuid/categories/:categorieUuid/vehicules/add',
            name: 'CatalogueVehiculeAdd',
            component: () => import('../views/CatalogueVehiculeForm.vue'),
            props: route => ({ 
                mode: 'add', 
                catalogueUuid: route.params.catalogueUuid,
                categorieUuid: route.params.categorieUuid
            }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/catalogue/:catalogueUuid/categories/:categorieUuid/vehicules/:vehiculeUuid',
            name: 'CatalogueVehiculeEdit',
            component: () => import('../views/CatalogueVehiculeForm.vue'),
            props: route => ({
                mode: 'edit',
                catalogueUuid: route.params.catalogueUuid,
                categorieUuid: route.params.categorieUuid,
                vehiculeUuid: route.params.vehiculeUuid
            }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        // TODO: Étapes 9 - Route analyse catalogue (temporairement commentée)
        /*
        {
            path: '/catalogue/:uuid/analyse',
            name: 'CatalogueAnalyse',
            component: () => import('../views/CatalogueAnalyseView.vue'),
            props: route => ({ uuid: route.params.uuid }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        */
        {
            path: '/comparos',
            name: 'comparos',
            component: () => import('../views/ComparosView.vue'),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/comparo/add',
            name: 'ComparoAdd',
            component: () => import('../views/ComparoForm.vue'),
            props: { mode: 'add' },
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/comparo/:uuid/vehicules',
            name: 'ComparoVehicules',
            component: () => import('../views/ComparoVehiculesView.vue'),
            props: route => ({ uuid: route.params.uuid }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/comparo/:uuidComparo/vehicules/add',
            name: 'VehiculeAdd',
            component: () => import('../views/VehiculeForm.vue'),
            props: route => ({ mode: 'add', comparoUuid: route.params.uuidComparo }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/comparo/:uuidComparo/vehicules/:uuidVehicule',
            name: 'VehiculeEdit',
            component: () => import('../views/VehiculeForm.vue'),
            props: route => ({
                mode: 'edit',
                comparoUuid: route.params.uuidComparo,
                vehiculeUuid: route.params.uuidVehicule
            }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/comparo/:uuid',
            name: 'ComparoEdit',
            component: () => import('../views/ComparoForm.vue'),
            props: route => ({ mode: 'edit', uuid: route.params.uuid }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/comparo/:uuid/analyse',
            name: 'ComparoAnalyse',
            component: () => import('../views/ComparoAnalyseView.vue'),
            props: route => ({ uuid: route.params.uuid }),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/calculette-aen',
            name: 'calculette-aen',
            component: () => import('../views/CalculetteAenView.vue'),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/calculateur-taxes',
            name: 'calculateur-taxes',
            component: () => import('../views/CalculateurTaxesView.vue'),
            meta: { layout: 'DefaultLayout', requiresAuth: true }
        },
        {
            path: '/account',
            component: AccountLayout,
            meta: { layout: 'DefaultLayout', requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'profile',
                    component: UserProfile,
                    meta: { requiresAuth: true }
                },
                {
                    path: 'password',
                    name: 'password',
                    component: PasswordView,
                    meta: { requiresAuth: true }
                }
            ]
        },
        {
            path: '/autoconnect/:token?',
            name: 'autoconnect',
            component: () => import('../views/auth/AutoConnectView.vue'),
            meta: { layout: 'EmptyLayout', requiresAuth: false }
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
            path: '/logout',
            name: 'logout',
            redirect: to => {
                localStorage.removeItem('token')
                localStorage.removeItem('refreshToken')
                return { name: 'login' }
            },
            meta: { requiresAuth: false }
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: NotFoundView,
            meta: { layout: 'DefaultLayout', requiresAuth: false }
        }
    ],
    scrollBehavior(to, from, savedPosition) {
        // Si il y a une position sauvegardée (navigation avec boutons back/forward)
        if (savedPosition) {
            return savedPosition
        }
        // Sinon, remonter en haut de la page
        return { top: 0 }
    }
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
