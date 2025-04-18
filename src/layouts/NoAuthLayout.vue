<script setup>
import { Toaster } from 'vue-sonner'
</script>

<template>
  <main>
    <div class="grid min-h-svh lg:grid-cols-2">
      <div class="flex flex-col gap-4 p-6 md:p-10">
        <div class="flex justify-center gap-2 md:justify-start">
          <RouterLink to="/">
            <img src="../assets/images/logo-bleu.png" alt="Logo" class="h-20 w-20"/>
          </RouterLink>
        </div>
        <div class="flex flex-1 items-center justify-center">
          <div class="w-full max-w-xs">
            <slot></slot>
          </div>
        </div>
      </div>
      <div class="relative hidden bg-muted lg:block">
        <img
            src="../assets/images/bg-login.jpg"
            alt="Image"
            class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        >
      </div>
    </div>
    <Toaster />
  </main>
</template>
