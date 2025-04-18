<!-- UserDropdown.vue -->
<script setup>
import { UserPen, Settings, LogOut, CircleUser } from 'lucide-vue-next'
import { ref } from 'vue'

// Optionnel : pour une gestion plus fine de la temporisation
const isHovering = ref(false)
</script>

<template>
  <div class="hover-dropdown dropdown-end relative group">
    <div role="button" class="btn btn-ghost btn-circle avatar flex items-center justify-center">
      <div class="w-10 rounded-full flex items-center justify-center">
        <CircleUser class="w-8 h-8"/>
      </div>
    </div>
    <ul
        class="menu menu-sm dropdown-content bg-base-200 rounded-box z-40 gap-2 w-44 p-2 shadow invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute top-full right-0">
      <li>
        <a>
          <UserPen class="inline-block mr-2"/>
          Mon compte
        </a>
      </li>
      <li>
        <a>
          <Settings class="inline-block mr-2"/>
          Configuration
        </a>
      </li>
      <li>
        <RouterLink to="/logout">
          <LogOut class="inline-block mr-2"/>
          Déconnexion
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Optionnel : si vous voulez une temporisation plus longue pour la disparition */
.hover-dropdown ul {
  transition-delay: 50ms; /* Légère temporisation avant l'apparition */
}

.hover-dropdown:hover ul {
  transition-delay: 0ms; /* Apparition immédiate au survol */
}

/* Temporisation plus longue pour la disparition */
.hover-dropdown ul:hover {
  visibility: visible;
  opacity: 1;
}
</style>
