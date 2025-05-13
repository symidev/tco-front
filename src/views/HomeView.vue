<script setup>
import { useStore } from 'vuex'
import {computed, watch} from 'vue'

const store = useStore()
const tokenInfo = computed(() => store.state.auth.tokenInfo)
</script>

<template>
  <div class="gap-3 w-full flex justify-center">
    <div class="w-full max-w-[1200px] flex flex-1 flex-col my-8">
      <h1 class="text-xl sm:text-2xl font-bold pb-6">Tableau de bord</h1>
    </div>
  </div>
</template>
