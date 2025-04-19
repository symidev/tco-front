<!-- DefaultLayout.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from '@/layouts/components/default/Sidebar.vue'
import Navbar from '@/layouts/components/default/Navbar.vue'
import SidebarToggleButton from '@/layouts/components/default/SidebarToggleButton.vue'

const isOpen = ref(true) // Sidebar ouverte par défaut
const isMobile = ref(false)

// Fonction pour vérifier si l'écran est en mode mobile
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768 // Point de rupture pour mobile (md)

  // Fermer la sidebar par défaut en mode mobile, l'ouvrir par défaut en mode desktop
  isOpen.value = !isMobile.value
}

// Basculer l'état de la sidebar
const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}

// Fermer la sidebar lorsqu'on clique en dehors (uniquement en mode mobile)
const closeSidebarOnOverlay = () => {
  if (isMobile.value) {
    isOpen.value = false
  }
}

// Ajouter les écouteurs d'événements lors du montage du composant
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

// Nettoyer les écouteurs d'événements lors du démontage du composant
onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<template>
  <div class="min-h-screen flex overflow-hidden" data-theme="dark">
    <!-- Sidebar component -->
    <Sidebar
        :isOpen="isOpen"
        :isMobile="isMobile"
        @toggleSidebar="toggleSidebar"
        @closeSidebar="isOpen = false"
    />

    <!-- Overlay pour fermer la sidebar en mode mobile -->
    <div
        v-if="isOpen && isMobile"
        class="fixed inset-0 bg-black bg-opacity-50 z-20"
        @click="closeSidebarOnOverlay"
    ></div>

    <!-- Contenu principal -->
    <div
        class="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out overflow-x-hidden"
        :class="{
          'ml-0 w-full': isMobile || !isOpen,
          'ml-56 w-[calc(100%-14rem)]': !isMobile && isOpen
        }"
    >
      <!-- Navigation Bar -->
      <Navbar
          :isOpen="isOpen"
          :isMobile="isMobile"
          @toggleSidebar="toggleSidebar"
      />

      <!-- Main Content -->
      <main class="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 flex-1">
        <slot></slot>
      </main>
    </div>

    <!-- Bouton flottant pour réafficher la sidebar (desktop uniquement) -->
    <SidebarToggleButton
        v-if="!isOpen && !isMobile"
        @click="toggleSidebar"
    />
  </div>
</template>
