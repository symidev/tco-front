<script setup>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { cn } from '@//lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    const result = await store.dispatch('auth/forgotPassword', { email: email.value })
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
      <h1 class="text-2xl font-bold text-bleu">
        Mot de passe oublié ?
      </h1>
      <p class="text-balance text-sm text-bleu">
        Entrez votre email pour réinitialiser votre mot de passe
      </p>
    </div>

    <div v-if="success" class="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
      Un email avec un lien pour réinitialiser votre mot de passe a été envoyé à votre adresse email.
    </div>

    <div v-if="error" class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ error }}
    </div>

    <div v-if="!success" class="grid gap-6">
      <div class="grid gap-2 text-bleu">
        <Label for="email" class="text-bleu">Email</Label>
        <Input 
          id="email" 
          v-model="email" 
          type="email" 
          placeholder="m@exemple.com" 
          required
        />
      </div>
      <Button 
        type="submit" 
        class="w-full text-white bg-bleu"
        :disabled="loading"
      >
        {{ loading ? 'Chargement...' : 'Réinitialiser le mot de passe' }}
      </Button>
    </div>
    <div class="text-center text-sm text-bleu">
      Vous n'avez pas encore de compte ?
      <div>
        <RouterLink to="register">
          <div class="underline underline-offset-4 text-bleu">
            Inscrivez-vous
          </div>
        </RouterLink>
      </div>
    </div>
  </form>
</template>
