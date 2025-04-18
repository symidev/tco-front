<script setup>
defineProps({
  currentStep: {
    type: Number,
    required: true
  },
  hasAccountingStep: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="flex justify-center mb-4">
    <div class="flex items-center">
      <!-- Étape 1 -->
      <div
          :class="[
          'w-8 h-8 rounded-full flex items-center justify-center',
          currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
        ]"
      >
        1
      </div>

      <!-- Connecteur entre étape 1 et 2 -->
      <div
          :class="[
          'h-1 w-12',
          currentStep >= 2 ? 'bg-primary' : 'bg-neutral text-white'
        ]"
      ></div>

      <!-- Étape 2 -->
      <div
          :class="[
          'w-8 h-8 rounded-full flex items-center justify-center',
          currentStep >= 2 ? 'bg-primary text-white' : 'bg-neutral text-white'
        ]"
      >
        2
      </div>

      <!-- Connecteur entre étape 2 et 3 (si étape comptable présente) -->
      <div
          v-if="hasAccountingStep"
          :class="[
          'h-1 w-12',
          currentStep >= 3 ? 'bg-primary' : 'bg-neutral'
        ]"
      ></div>

      <!-- Étape 3 (si étape comptable présente) -->
      <div
          v-if="hasAccountingStep"
          :class="[
          'w-8 h-8 rounded-full flex items-center justify-center',
          currentStep >= 3 ? 'bg-primary text-white' : 'bg-neutral text-white'
        ]"
      >
        3
      </div>
    </div>
  </div>
</template>
