<script setup>
import { RouterView } from 'vue-router'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import NoAuthLayout from '@/layouts/NoAuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import EmptyLayout from '@/layouts/EmptyLayout.vue'

const layouts = {
  NoAuthLayout,
  DefaultLayout
}

const route = useRoute()
const store = useStore()

// Computed layout based on route meta
const layout = computed(() => layouts[route.meta.layout] || EmptyLayout)

// Check if user is authenticated
const isAuthenticated = computed(() => !!store.state.auth.token)

// On charge le profil de l'utilisateur uniquement si on est sur la page de profil
// Cela évite de faire l'appel sur toutes les pages
onMounted(() => {
  /*if (isAuthenticated.value) {
    store.dispatch('user/fetchUserProfile')
  }*/
})
</script>
<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>
