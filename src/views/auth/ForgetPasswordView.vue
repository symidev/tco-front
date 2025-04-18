<script setup>
import {ref} from 'vue'
import {useStore} from 'vuex'
import {cn} from '@//lib/utils'

const store = useStore()
const email = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref(null)

const handleSubmit = async (e) => {
  e.preventDefault()
  loading.value = true
  error.value = null

  try {
    const result = await store.dispatch('auth/forgotPassword', {email: email.value})
    if (result.success) {
      success.value = true
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = "Une erreur est survenue lors de la demande"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form :class="cn('flex flex-col gap-6')" @submit="handleSubmit">
    <div class="flex flex-col items-center gap-2 text-center">
      <h1 class="text-2xl font-bold">
        Mot de passe oublié ?
      </h1>
      <p class="text-balance text-sm">
        Entrez votre email pour réinitialiser votre mot de passe
      </p>
    </div>

    <div v-if="success" class="p-4 bg-white border border-success text-success rounded">
      Vous allez recevoir un email avec un lien pour réinitialiser votre mot de passe si cet email est associé à un compte.
    </div>

    <div role="alert" v-if="error" class="alert alert-error alert-soft">
      {{ error }}
    </div>

    <div v-if="!success" class="grid gap-6">
      <div class="grid gap-2">
        <label class="input">
          <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
              <rect width="20" height="16" x="2" y="4" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </g>
          </svg>
          <input
              type="email"
              id="email"
              v-model="email"
              placeholder="Votre email"
              required
          />
        </label>
      </div>
      <button
          type="submit"
          class="w-full btn btn-primary"
          :disabled="loading"
      >
        {{ loading ? 'Chargement...' : 'Réinitialiser le mot de passe' }}
      </Button>
    </div>
    <div class="text-center text-sm">
      Vous avez déjà un compte ?
      <div class="underline underline-offset-4">
        <RouterLink to="/login">
          Connectez-vous
        </RouterLink>
      </div>
    </div>
  </form>
</template>
