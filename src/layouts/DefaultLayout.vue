<!-- DefaultLayout.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from '@/layouts/default/Sidebar.vue'
import Navbar from '@/layouts/default/Navbar.vue'
import SidebarToggleButton from '@/layouts/default/SidebarToggleButton.vue'

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
  <div class="min-h-screen flex" data-theme="dark">
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
        class="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out px-0 md:px-8"
        :class="{'ml-0': isMobile || !isOpen, 'ml-64': !isMobile && isOpen}"
    >
      <!-- Navigation Bar -->
      <Navbar
          :isOpen="isOpen"
          :isMobile="isMobile"
          @toggleSidebar="toggleSidebar"
      />

      <!-- Main Content -->
      <main class="container max-w-7xl mx-auto px-4 py-8 flex-1">
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
