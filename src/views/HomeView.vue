<script setup>
import { useStore } from 'vuex'

const store = useStore()
const token = store.getters['auth/getToken']
const refreshToken = store.getters['auth/getRefreshToken']
</script>

<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Bienvenue sur la page d'accueil</h1>
    
    <div class="bg-gray-100 p-4 rounded-lg mb-4">
      <h2 class="font-bold mb-2">Votre token JWT :</h2>
      <div class="bg-white p-2 rounded overflow-auto text-sm">
        {{ token }}
      </div>
    </div>
    
    <div class="bg-gray-100 p-4 rounded-lg">
      <h2 class="font-bold mb-2">Votre refresh token :</h2>
      <div class="bg-white p-2 rounded overflow-auto text-sm">
        {{ refreshToken }}
      </div>
    </div>
  </div>
</template>