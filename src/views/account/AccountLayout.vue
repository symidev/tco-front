<script setup>
import { ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="container mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-6">
    <div class="card bg-base-100 shadow-sm overflow-hidden">
      <div class="card-body p-3 sm:p-6">
        <h1 class="card-title text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Mon compte</h1>

        <div class="tabs tabs-bordered mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap">
          <RouterLink
              :to="{ name: 'profile' }"
              class="tab tab-sm sm:tab-md md:tab-lg hover:text-primary"
              :class="{ 'tab-active text-primary': route.name === 'profile' }"
          >
            Édition du profil
          </RouterLink>
          <RouterLink
              :to="{ name: 'password' }"
              class="tab tab-sm sm:tab-md md:tab-lg hover:text-primary"
              :class="{ 'tab-active text-primary': route.name === 'password' }"
          >
            Mot de passe
          </RouterLink>
        </div>

        <router-view></router-view>
      </div>
    </div>
  </div>
</template>
