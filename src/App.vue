<script setup>
import {RouterView} from 'vue-router'
import {computed} from 'vue'
import {useRoute} from 'vue-router'
import {useStore} from 'vuex'
import NoAuthLayout from '@/layouts/NoAuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import EmptyLayout from '@/layouts/EmptyLayout.vue'
import {toast} from 'vue-sonner'

const layouts = {
  NoAuthLayout,
  DefaultLayout
}

const route = useRoute()
const store = useStore()

const layout = computed(() => layouts[route.meta.layout] || EmptyLayout)

//const isAuthenticated = computed(() => !!store.state.auth.token)

const checkRfeParameter = query => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('rfe')) {
    // Utiliser setTimeout pour s'assurer que l'application est complètement montée
    setTimeout(() => {
      toast.error("Une erreur est survenue lors du téléchargement du fichier. Veuillez réessayer.");
    }, 500);
  }
};

checkRfeParameter();
//window.addEventListener('popstate', checkRfeParameter);

</script>
<template>
  <component :is="layout">
    <RouterView/>
  </component>
</template>
