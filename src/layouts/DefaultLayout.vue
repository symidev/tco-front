<!-- App.vue -->
<script setup>
import { ref } from 'vue'
import { User } from 'lucide-vue-next'

const isOpen = ref(false)
</script>

<template>
  <div class="min-h-screen" data-theme="dark">
    <!-- Navigation Bar -->
    <header class="border-b">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center">
          <a href="/" class="text-xl font-bold">
            <!-- Remplacer par votre logo -->
            <img src="@/assets/images/logo-bleu.png" alt="Logo" class="h-8" />
          </a>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <slot></slot>
    </main>
  </div>
</template>
