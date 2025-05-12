<!-- DefaultLayout.vue -->
<script setup>
import Navbar from '@/layouts/components/default/Navbar.vue'
import {onMounted} from 'vue'

onMounted(() => {
  document.body.classList.add('dark');
})
</script>

<template>
  <div class="min-h-screen flex overflow-hidden">
    <div class="flex-1 flex flex-col">
      <Navbar />
      <main class="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <slot></slot>
      </main>
    </div>
  </div>
</template>
