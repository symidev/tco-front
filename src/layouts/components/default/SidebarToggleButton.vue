<script setup>
import Button from 'primevue/button'
</script>
<template>
  <Button icon="pi pi-bars" class="p-button-text" @click="$emit('toggle')" />
</template>

<style scoped>
/* Ajustements si besoin */
</style>
