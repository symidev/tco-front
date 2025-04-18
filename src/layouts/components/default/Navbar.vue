<!-- Navbar.vue -->
<script setup>
import { Menu, Search } from 'lucide-vue-next'
import UserDropdown from '@/layouts/components/default/UserDropdown.vue'

const props = defineProps({
  isOpen: Boolean,
  isMobile: Boolean
})

const emit = defineEmits(['toggleSidebar'])

const toggleSidebar = () => {
  emit('toggleSidebar')
}
</script>

<template>
  <header class="navbar bg-base-100 shadow-sm h-16 w-full flex items-center z-10 border-b border-base-300">
    <!-- Bouton de menu ou Logo -->
    <div class="navbar-start flex items-center gap-3">
      <!-- Bouton de menu (visible uniquement quand la sidebar est masquée) -->
      <button v-if="!props.isOpen" @click="toggleSidebar" class="btn btn-ghost btn-circle">
        <Menu class="w-6 h-6" />
      </button>

      <!-- Logo à gauche (visible uniquement quand la sidebar est masquée) -->
      <RouterLink v-if="!props.isOpen" to="/">
        <img src="@/assets/images/logo.png" alt="Logo" class="h-10 w-10"/>
      </RouterLink>

      <!-- Barre de recherche à gauche (uniquement en mode non-mobile) -->
      <div v-if="!props.isMobile" class="relative flex items-center w-auto min-w-[10rem]">
        <div class="input input-bordered rounded-4xl input-sm bg-base-200 flex items-center w-full overflow-hidden">
          <Search class="flex-shrink-0 ml-2"/>
          <input
              type="text"
              placeholder="Rechercher"
              class="ml-2 w-40 focus:w-60 transition-all duration-300 ease-in-out bg-transparent border-none focus:outline-none"
          />
        </div>
      </div>
    </div>

    <!-- Barre de recherche au milieu (uniquement en mode mobile) -->
    <div class="navbar-center flex items-center">
      <div v-if="props.isMobile" class="input input-bordered rounded-4xl input-sm bg-base-200 relative">
        <Search class="absolute left-2 top-1/2 transform -translate-y-1/2"/>
        <input
            type="text"
            placeholder="Rechercher"
            class="ml-6 w-32"
        />
      </div>
    </div>

    <!-- UserDropdown à droite -->
    <div class="navbar-end flex items-center">
      <UserDropdown />
    </div>
  </header>
</template>
