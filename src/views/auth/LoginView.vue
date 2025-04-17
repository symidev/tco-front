<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
      <h1 class="text-2xl font-bold text-bleu">
        Connectez-vous à votre compte
      </h1>
      <p class="text-balance text-sm text-bleu">
        Entrez vos identifiants pour vous connecter
      </p>
    </div>
    
    <div v-if="loginError" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
      {{ loginError }}
    </div>
    
    <div class="grid gap-6">
      <div class="grid gap-2 text-bleu">
        <Label for="login" class="text-bleu">Login</Label>
        <Input 
          id="login" 
          v-model="formData.login" 
          placeholder="username" 
          required
          :class="errors.login ? 'border-red-500' : ''"
        />
        <p v-if="errors.login" class="text-red-500 text-xs mt-1">{{ errors.login }}</p>
      </div>
      
      <div class="grid gap-2">
        <div class="flex items-center">
          <Label for="password" class="text-bleu">Mot de passe</Label>
          <div
            class="ml-auto text-sm underline-offset-4 hover:underline text-bleu text-right"
          >
            <RouterLink to="forget-password">
              Mot de passe oublié ?
            </RouterLink>
          </div>
        </div>
        <Input 
          id="password" 
          type="password" 
          v-model="formData.password" 
          required
          :class="errors.password ? 'border-red-500' : ''"
        />
        <p v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</p>
      </div>
      
      <Button 
        type="submit" 
        class="w-full text-white bg-bleu cursor-pointer"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Connexion en cours...' : 'Connexion' }}
      </Button>
    </div>
    
    <div class="text-center text-sm text-bleu">
      Vous n'avez pas encore de compte ?
      <div class="underline underline-offset-4 text-bleu">
        <RouterLink to="register">
          Inscrivez-vous
        </RouterLink>
      </div>
    </div>
  </form>
</template>