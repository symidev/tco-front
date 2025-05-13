<script setup>
import Button from 'primevue/button'
import { Menu } from 'lucide-vue-next'
</script>
<template>
  <div class="fixed bottom-4 right-4 z-40">
    <Button 
      class="p-button-rounded p-button-primary" 
      @click="$emit('toggle')"
    >
      <Menu class="w-5 h-5" />
    </Button>
  </div>
</template>

<style scoped>
/* Ajustements si besoin */
</style>
