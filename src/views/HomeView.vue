<script setup>
import { useStore } from 'vuex'
import {computed, watch} from 'vue'

const store = useStore()
const tokenInfo = computed(() => store.state.auth.tokenInfo)
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-center mb-6">
      <h1 class="text-2xl font-bold">Tableau de bord</h1>
{{tokenInfo.drupal?.uid ?? 'toto'}}
    </div>
  </div>
</template>
