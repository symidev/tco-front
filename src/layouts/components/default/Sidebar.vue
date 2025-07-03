<!-- Sidebar.vue -->
<script setup>
import { Car, FileText, Book, Calculator, ChevronsLeft, Home, BarChart3, Settings, Users, Building2 } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  isMobile: Boolean
})

const emit = defineEmits(['toggleSidebar', 'closeSidebar'])

// Récupérer la route active et le store
const route = useRoute()
const store = useStore()

// Fermer la sidebar lorsqu'un lien est cliqué (uniquement en mode mobile)
const closeSidebarOnMobile = () => {
  if (props.isMobile) {
    emit('closeSidebar')
  }
}

// Basculer l'état de la sidebar
const toggleSidebar = () => {
  emit('toggleSidebar')
}

// Vérifier si un lien est actif
const isActive = (path) => {
  // Pour les comparatifs, considérer comme actif toutes les routes /comparo*
  if (path === '/comparos') {
    return route.path === '/comparos' || route.path.startsWith('/comparo')
  }
  return route.path === path
}

// Fonction pour vérifier si l'utilisateur a les permissions nécessaires
const hasPermission = (permissions) => {
  // Si aucune permission n'est requise
  if (!permissions || permissions.length === 0) {
    return true
  }

  // Récupérer les rôles de l'utilisateur
  const userRoles = computed( () => store.state.auth?.tokenInfo?.drupal?.roles || [])
  // Vérifier que userRoles est bien un tableau
  if (!Array.isArray(userRoles.value)) {
    console.warn('Les rôles utilisateur ne sont pas dans un format valide');
    return false;
  }

  // Normalisation et comparaison insensible à la casse
  return permissions.some(permission => {
    if (typeof permission !== 'string') return false;
    const normalizedPermission = permission.trim().toLowerCase();
    return userRoles.value.some(role =>
        typeof role === 'string' && role.trim().toLowerCase() === normalizedPermission
    );
  });
}

// Configuration des groupes de menu
const menuGroups = [
  {
    title: 'Général',
    items: [
      { path: '/', icon: Home, label: 'Tableau de bord' }
    ]
  },
  {
    title: 'Outils',
    items: [
      { path: '/comparos', icon: BarChart3, label: 'Comparatifs', permissions: ['comparo', 'catalogue'] },
      { path: '/catalogues', icon: Book, label: 'Catalogues', permissions: ['catalogue'] },
      { path: '/calculateur', icon: Calculator, label: 'Calculateur', permissions: ['catalogue'] }
    ]
  }
]

// Liste plate pour compatibilité (deprecated - utiliser menuGroups)
const allMenuItems = [
  { path: '/', icon: Home, label: 'Tableau de bord' },
  { path: '/comparos', icon: BarChart3, label: 'Comparatifs', permissions: ['comparo', 'catalogue'] },
  { path: '/catalogues', icon: Book, label: 'Catalogues', permissions: ['catalogue'] },
  { path: '/calculateur', icon: Calculator, label: 'Calculateur', permissions: ['catalogue'] }
]

// Filtrer les éléments du menu selon les permissions de l'utilisateur
const menuItems = computed(() => {
  return allMenuItems.filter(item => hasPermission(item.permissions))
})

// Filtrer les groupes de menu selon les permissions
const filteredMenuGroups = computed(() => {
  return menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => hasPermission(item.permissions))
  })).filter(group => group.items.length > 0)
})
</script>

<template>
  <aside
      :class="[
      'sidebar bg-gradient-to-b from-surface-900 to-surface-950 z-30 transition-all duration-300 ease-in-out flex flex-col border-r border-surface-700',
      !props.isMobile ? 'h-screen fixed top-0 left-0 w-64' : 'h-auto w-48',
      !props.isMobile && (props.isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full')
    ]"
  >
    <!-- Header avec logo -->
    <div class="sidebar-header p-3 border-b border-surface-700/50">
      <RouterLink to="/" @click="closeSidebarOnMobile" class="block transition-transform hover:scale-105">
        <img src="@/assets/images/logo.png" alt="Logo" class="h-10 mx-auto filter brightness-110"/>
      </RouterLink>
    </div>

    <!-- Navigation par groupes -->
    <nav class="sidebar-nav flex-1 overflow-y-auto">
      <div v-for="group in filteredMenuGroups" :key="group.title" class="menu-group">
        <h3 class="group-title px-4 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider border-b border-surface-800/30">
          {{ group.title }}
        </h3>

        <ul class="group-items py-2">
          <li v-for="item in group.items" :key="item.path" class="menu-item">
            <RouterLink
                :to="item.path"
                @click="closeSidebarOnMobile"
                :class="[
                  'menu-link flex items-center px-4 py-3 mx-2 rounded-lg transition-all duration-200 group relative',
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary border-l-4 border-primary shadow-lg transform scale-[1.02]'
                    : 'text-surface-200 hover:bg-surface-800/50 hover:text-white hover:transform hover:translate-x-1'
                ]"
            >
              <!-- Icône avec animation -->
              <component
                :is="item.icon"
                :class="[
                  'w-5 h-5 mr-3 transition-all duration-200',
                  isActive(item.path) ? 'text-primary scale-110' : 'text-surface-400 group-hover:text-white group-hover:scale-105'
                ]"
              />

              <!-- Label -->
              <span class="font-medium text-sm">{{ item.label }}</span>

              <!-- Indicateur actif -->
              <div
                v-if="isActive(item.path)"
                class="absolute right-2 w-2 h-2 bg-primary rounded-full animate-pulse"
              ></div>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Footer de la sidebar
    <div class="sidebar-footer p-4 border-t border-surface-700/50">
      <div class="text-center">
        <div class="text-xs text-surface-500">
          Version 1.0.0
        </div>
      </div>
    </div>-->
  </aside>
</template>

<style scoped>
/* Sidebar principale */
.sidebar {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Header */
.sidebar-header {
  background: linear-gradient(135deg, rgba(var(--primary-500), 0.1) 0%, transparent 100%);
}

/* Navigation */
.sidebar-nav {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* Groupes de menu */
.menu-group:not(:last-child) {
  margin-bottom: 1rem;
}

.group-title {
  position: sticky;
  top: 0;
  background: linear-gradient(to bottom, var(--surface-900), var(--surface-950));
  z-index: 10;
}

/* Items de menu */
.menu-item {
  position: relative;
}

.menu-link {
  position: relative;
  overflow: hidden;
}

.menu-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.menu-link:hover::before {
  left: 100%;
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.menu-item {
  animation: slideIn 0.3s ease-out;
  animation-fill-mode: both;
}

.menu-item:nth-child(1) { animation-delay: 0.1s; }
.menu-item:nth-child(2) { animation-delay: 0.2s; }
.menu-item:nth-child(3) { animation-delay: 0.3s; }
.menu-item:nth-child(4) { animation-delay: 0.4s; }
.menu-item:nth-child(5) { animation-delay: 0.5s; }

/* États de focus et accessibilité */
.menu-link:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: -2px;
}

.menu-link:focus-visible {
  box-shadow: 0 0 0 2px var(--primary-500);
}

/* Mode mobile */
@media (max-width: 767px) {
  .sidebar {
    overflow-y: visible;
    height: auto;
  }

  .menu-link {
    padding: 0.75rem 1rem;
    margin: 0 0.5rem;
  }

  .group-title {
    padding: 0.75rem 1rem;
    font-size: 0.625rem;
  }

  .sidebar-footer {
    display: none;
  }
}

/* Mode sombre amélioré */
@media (prefers-color-scheme: dark) {
  .sidebar {
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.3);
  }
}

/* Transitions fluides */
* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
