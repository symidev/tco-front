<script setup>
import {ref, reactive} from 'vue'
import {useRouter} from 'vue-router'
import {useStore} from 'vuex'
import {cn} from '@/lib/utils'

const store = useStore()
const router = useRouter()

const formData = reactive({
  login: '',
  password: ''
})

const errors = reactive({
  login: '',
  password: ''
})
const isSubmitting = ref(false)
const loginError = ref('')

const validatePassword = (password) => {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':",.<>?]/.test(password)

  if (password.length < minLength) {
    return 'Le mot de passe doit contenir au moins 8 caractères'
  }

  if (!hasUpperCase) {
    return 'Le mot de passe doit contenir au moins une majuscule'
  }

  if (!hasLowerCase) {
    return 'Le mot de passe doit contenir au moins une minuscule'
  }

  if (!hasNumber) {
    return 'Le mot de passe doit contenir au moins un chiffre'
  }

  if (!hasSpecialChar) {
    return 'Le mot de passe doit contenir au moins un caractère spécial'
  }

  return ''
}

const handleSubmit = async () => {
  // Reset errors
  errors.login = ''
  errors.password = ''
  loginError.value = ''

  // Validate form
  let isValid = true

  if (!formData.login) {
    errors.login = 'Le login est requis'
    isValid = false
  }

  const passwordError = validatePassword(formData.password)
  if (passwordError) {
    errors.password = passwordError
    isValid = false
  }

  if (!isValid) return

  isSubmitting.value = true

  try {
    const result = await store.dispatch('auth/login', {
      login: formData.login,
      password: formData.password
    })

    if (result.success) {
      router.push('/')
    } else {
      loginError.value = result.error || 'Échec de connexion'
    }
  } catch (error) {
    loginError.value = 'Une erreur est survenue lors de la connexion'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" :class="cn('flex flex-col gap-6')">
    <div class="flex flex-col items-center gap-2 text-center">
      <h1 class="text-2xl font-bold">
        Connectez-vous à votre compte
      </h1>
      <p class="text-balance text-sm">
        Entrez vos identifiants pour vous connecter
      </p>
    </div>

    <div role="alert" v-if="loginError" class="alert alert-error alert-soft">
      {{ loginError }}
    </div>

    <div class="grid gap-6">
      <div class="grid gap-2">
        <label for="login" class="text-primary">Email</Label>
        <label :class="errors.login ? 'border-error input' : 'input'">
          <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
              <rect width="20" height="16" x="2" y="4" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </g>
          </svg>

          <input
              type="email"
              id="login"
              v-model="formData.login"
              placeholder="Votre email"
              required
          />
        </label>
        <p v-if="errors.login" class="text-error text-xs mt-1">{{ errors.login }}</p>
      </div>

      <div class="grid gap-2">
        <div class="flex items-center">
          <label for="password" class="text-primary">Mot de passe</Label>
          <div class="ml-auto text-sm text-right">
            <RouterLink to="forget-password" class="link">
              Mot de passe oublié ?
            </RouterLink>
          </div>
        </div>
        <label class="input" :class="errors.password ? 'border-error' : ''">
          <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </g>
          </svg>
          <input
              id="password"
              type="password"
              placeholder="Votre mot de passe"
              v-model="formData.password"
              required
          />
        </label>
        <p role="alert" v-if="errors.password" class="alert alert-error alert-soft">{{ errors.password }}</p>
      </div>

      <button
          type="submit"
          class="w-full btn btn-primary"
          :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Connexion en cours...' : 'Connexion' }}
      </Button>
    </div>

    <div class="text-center text-sm">
      Vous n'avez pas encore de compte ?
      <div>
        <RouterLink to="register" class="link">
          Inscrivez-vous
        </RouterLink>
      </div>
    </div>
  </form>
</template>
