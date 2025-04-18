<script setup>
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()
const token = store.getters['auth/getToken']
const refreshToken = store.getters['auth/getRefreshToken']

const logout = () => {
  store.dispatch('auth/logout')
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Bienvenue sur la page d'accueil</h1>
      <button @click="logout" variant="destructive">Se déconnecter</Button>
    </div>


    <div class="p-4 rounded-lg mb-4">
      <h2 class="font-bold mb-2 bg-warning text-warning-content">Votre token JWT :</h2>
      <div class="p-2 rounded overflow-auto text-sm">
        {{ token }}
      </div>
    </div>

    <div class="p-4 rounded-lg">
      <h2 class="font-bold mb-2">Votre refresh token :</h2>
      <div class="p-2 rounded overflow-auto text-sm">
        {{ refreshToken }}
      </div>
    </div>

    <div class="mt-6">
      <a class="link" href="/logout">Ou déconnexion via route /logout</a>
    </div>
  </div>
</template>
