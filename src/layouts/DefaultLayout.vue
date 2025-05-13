<!-- DefaultLayout.vue -->
<script setup>
import Navbar from '@/layouts/components/default/Navbar.vue'
import {ref, onMounted, onUnmounted} from 'vue'
import Sidebar from "@/layouts/components/default/Sidebar.vue";
import Drawer from 'primevue/drawer';


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
  document.body.classList.add('dark');
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

// Nettoyer les écouteurs d'événements lors du démontage du composant
onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<template>
  <div class="min-h-screen flex overflow-hidden">
    <!-- Sidebar pour desktop -->
    <Sidebar
        v-if="!isMobile"
        :isOpen="isOpen"
        :isMobile="isMobile"
        @toggleSidebar="toggleSidebar"
        @closeSidebar="isOpen = false"
    />

    <!-- Drawer pour mobile -->
    <Drawer
        v-if="isMobile"
        v-model:visible="isOpen"
        position="left"
        :modal="true"
        :showCloseIcon="true"
        class="w-40 p-0"
        :contentStyle="{ padding: '0', overflow: 'hidden' }"
        @hide="isOpen = false"
    >
      <Sidebar
          :isOpen="true"
          :isMobile="isMobile"
          @toggleSidebar="toggleSidebar"
          @closeSidebar="isOpen = false"
          class="static transform-none shadow-none w-full bg-surface-900"
      />
    </Drawer>

    <div
        class="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out overflow-x-hidden"
        :class="{
          'ml-0 w-full': isMobile || !isOpen,
          'ml-56 w-[calc(100%-14rem)]': !isMobile && isOpen
        }"
    >
      <div class="fixed top-0 left-0 right-0 z-50" :class="{
          'ml-0': isMobile || !isOpen,
          'ml-56': !isMobile && isOpen
        }">
        <Navbar
            :isMobile="isMobile"
            @toggleMobileSidebar="toggleSidebar"
        />
      </div>
      <main class="w-full px-8 sm:px-12 md:px-16 py-4 sm:py-6 md:py-8 mt-16">
        <slot></slot>
      </main>
    </div>
  </div>
</template>
