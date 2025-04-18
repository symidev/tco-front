<!-- Sidebar.vue -->
<script setup>
import { Car, FileText, Book, Calculator, ChevronsLeft, Home } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

const props = defineProps({
  isOpen: Boolean,
  isMobile: Boolean
})

const emit = defineEmits(['toggleSidebar', 'closeSidebar'])

// Récupérer la route active
const route = useRoute()

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

// Liste des éléments du menu
const menuItems = [
  { path: '/', icon: Home, label: 'Tableau de bord' },
  { path: '/vehicules', icon: Car, label: 'Véhicules' },
  { path: '/comparos', icon: FileText, label: 'Comparatifs' },
  { path: '/catalogues', icon: Book, label: 'Catalogues' },
  { path: '/calc-aen', icon: Calculator, label: 'Calculateur AEN' }
]
</script>

<template>
  <aside
      :class="[
      'sidebar bg-base-200 fixed top-0 left-0 h-screen z-30 w-56 transition-all duration-300 ease-in-out flex flex-col',
      props.isOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full'
    ]"
  >
    <!-- Logo en haut de la sidebar -->
    <div class="p-2 border-b border-base-300">
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
            :class="['flex items-center', isActive(item.path) ? 'text-primary font-medium rounded-lg hover:bg-base-200 cursor-default' : '']"
        >
          <component :is="item.icon" class="w-5 h-5 mr-2" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>

    <!-- Bouton de basculement en bas de la sidebar -->
    <div class="border-t border-base-300 px-6 py-2">
      <button
          @click="toggleSidebar"
          class="btn btn-circle btn-sm w-full flex justify-center bg-base-200 hover:bg-base-100"
      >
        <ChevronsLeft class="w-5 h-5" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* Assurer que la sidebar prend toute la hauteur et gère le défilement */
.sidebar {
  height: 100vh;
  overflow-y: auto;
}
</style>
