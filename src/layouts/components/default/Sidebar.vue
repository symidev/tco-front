<!-- Sidebar.vue -->
<script setup>
import { Car, FileText, Book, Calculator, ChevronsLeft, Home } from 'lucide-vue-next'
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

// Liste des éléments du menu avec les permissions requises
const allMenuItems = [
  { path: '/', icon: Home, label: 'Tableau de bord' },
  { path: '/comparos', icon: FileText, label: 'Comparatifs', permissions: ['comparo', 'catalogue'] },
  { path: '/catalogues', icon: Book, label: 'Catalogues', permissions: ['catalogue'] },
  { path: '/calc-aen', icon: Calculator, label: 'Calculateur AEN', permissions: ['catalogue'] }
]

// Filtrer les éléments du menu selon les permissions de l'utilisateur
const menuItems = computed(() => {
  return allMenuItems.filter(item => hasPermission(item.permissions))
})
</script>

<template>
  <aside
      :class="[
      'sidebar bg-surface-900 z-30 transition-all duration-300 ease-in-out flex flex-col',
      !props.isMobile ? 'h-screen fixed top-0 left-0 w-56' : 'h-auto w-40',
      !props.isMobile && (props.isOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full')
    ]"
  >
    <!-- Logo en haut de la sidebar -->
    <div class="p-2 border-b border-logo-color">
      <RouterLink to="/" @click="closeSidebarOnMobile">
        <img src="@/assets/images/logo.png" alt="Logo" class="h-12 mx-auto"/>
      </RouterLink>
    </div>

    <!-- Éléments du menu -->
    <ul class="menu p-4 gap-2 flex-1">
      <li v-for="item in menuItems" :key="item.path">
        <RouterLink
            :to="item.path"
            @click="closeSidebarOnMobile"
            :class="['flex items-center my-3', isActive(item.path) ? 'text-primary font-medium rounded-lg hover:bg-base-200 cursor-default' : 'text-surface-100']"
        >
          <component :is="item.icon" class="w-5 h-5 mr-2" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>

    <!-- Bouton de basculement en bas de la sidebar -->
    <!--<div class="border-t border-base-300 px-6 py-2">
      <button
          @click="toggleSidebar"
          class="btn btn-circle btn-sm w-full flex justify-center bg-base-200 hover:bg-base-100"
      >
        <ChevronsLeft class="w-5 h-5" />
      </button>
    </div>-->
  </aside>
</template>

<style scoped>
/* Assurer que la sidebar gère correctement le défilement selon le mode */
.sidebar {
  overflow-y: auto;
}

/* Ajuster le style en mode mobile pour éviter le défilement */
@media (max-width: 767px) {
  .sidebar {
    overflow-y: visible;
    height: auto;
  }
}
</style>
