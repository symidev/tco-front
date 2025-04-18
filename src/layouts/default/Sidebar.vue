<!-- Sidebar.vue -->
<script setup>
import { Car, FileText, Book, Calculator, ChevronsLeft } from 'lucide-vue-next'

defineProps({
  isOpen: Boolean,
  isMobile: Boolean
})

const emit = defineEmits(['toggleSidebar', 'closeSidebar'])

// Fermer la sidebar lorsqu'un lien est cliqué (uniquement en mode mobile)
const closeSidebarOnMobile = () => {
  emit('closeSidebar')
}

// Basculer l'état de la sidebar
const toggleSidebar = () => {
  emit('toggleSidebar')
}
</script>

<template>
  <aside
      :class="[
      'sidebar bg-base-200 fixed top-0 left-0 h-screen z-30 w-64 transition-all duration-300 ease-in-out flex flex-col',
      isOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full'
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
      <li>
        <RouterLink to="/vehicles" @click="closeSidebarOnMobile" class="flex items-center">
          <Car class="w-5 h-5 mr-2" />
          <span>Mes véhicules</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/comparisons" @click="closeSidebarOnMobile" class="flex items-center">
          <FileText class="w-5 h-5 mr-2" />
          <span>Mes comparatifs</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/catalogs" @click="closeSidebarOnMobile" class="flex items-center">
          <Book class="w-5 h-5 mr-2" />
          <span>Mes catalogues</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/calculator" @click="closeSidebarOnMobile" class="flex items-center">
          <Calculator class="w-5 h-5 mr-2" />
          <span>Calculateur AEN</span>
        </RouterLink>
      </li>
    </ul>

    <!-- Bouton de basculement en bas de la sidebar -->
    <div class="border-t border-base-300 p-4">
      <button
          @click="toggleSidebar"
          class="btn btn-circle btn-sm btn-ghost w-full flex justify-center"
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
