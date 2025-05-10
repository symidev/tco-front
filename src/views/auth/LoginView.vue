<script setup>
import {ref, reactive, computed, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useStore} from 'vuex'
import {useToast} from 'primevue/usetoast'
import {cn} from '@/lib/utils'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import FloatLabel from 'primevue/floatlabel';
import Password from 'primevue/password'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import { Key, Mail, LogIn } from 'lucide-vue-next';

const store = useStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

// États réactifs
const formData = reactive({
  login: '',
  password: ''
})
const errors = reactive({
  login: '',
  password: ''
})
const isSubmitting = ref(false)
const isFormSubmitted = ref(false)

// Computed properties pour l'invalidation des champs
const showLoginError = computed(() => isFormSubmitted.value && errors.login)
const showPasswordError = computed(() => isFormSubmitted.value && errors.password)

// Vérifier la redirection pour session expirée
onMounted(() => {
  if (route.query.reason === 'se') {
    toast.add({
      severity: 'error',
      summary: 'Session expirée',
      detail: 'Votre session a expiré. Veuillez vous reconnecter pour continuer.',
      life: 5000
    })
  }
})

// Validation du mot de passe
const validatePassword = (password) => {
  if (!password) return 'Le mot de passe est requis'

  const validations = [
    {test: password.length >= 8, message: 'Le mot de passe doit contenir au moins 8 caractères'},
    {test: /[A-Z]/.test(password), message: 'Le mot de passe doit contenir au moins une majuscule'},
    {test: /[a-z]/.test(password), message: 'Le mot de passe doit contenir au moins une minuscule'},
    {test: /[0-9]/.test(password), message: 'Le mot de passe doit contenir au moins un chiffre'},
    {
      test: /[!@#$%^&*()_+\-=\[\]{};':",.<>?]/.test(password),
      message: 'Le mot de passe doit contenir au moins un caractère spécial'
    }
  ]

  for (const validation of validations) {
    if (!validation.test) return validation.message
  }

  return ''
}

// Validation du formulaire
const validateForm = () => {
  isFormSubmitted.value = true
  errors.login = !formData.login ? 'L\'email est requis' : ''
  errors.password = validatePassword(formData.password)

  if (errors.login) {
    toast.add({
      severity: 'error',
      summary: 'Erreur de validation',
      detail: errors.login,
      life: 5000
    })
    return false
  }

  if (errors.password) {
    toast.add({
      severity: 'error',
      summary: 'Erreur de validation',
      detail: errors.password,
      life: 5000
    })
    return false
  }

  return true
}

// Soumission du formulaire
const handleSubmit = async () => {
  // Valider le formulaire
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    const result = await store.dispatch('auth/login', {
      login: formData.login,
      password: formData.password
    })

    if (result.success) {
      // Afficher un toast de succès
      toast.add({
        severity: 'success',
        summary: 'Connexion réussie',
        detail: 'Vous êtes maintenant connecté',
        life: 3000
      })
      router.replace('/')
    } else {
      toast.add({
        severity: 'error',
        summary: 'Échec de connexion',
        detail: result.error || 'Identifiants incorrects',
        life: 5000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur de connexion',
      detail: 'Une erreur est survenue lors de la connexion',
      life: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Card class="login-card">
    <template #content>
      <form @submit.prevent="handleSubmit" :class="cn('flex flex-col gap-4')">
        <div class="flex flex-col items-center gap-2 text-center">
          <h1 class="text-xl font-bold">
            Connectez-vous à votre compte
          </h1>
          <p class="text-balance text-sm">
            Entrez vos identifiants pour vous connecter
          </p>
        </div>

        <div class="grid gap-6">
          <!-- Champ Email -->
          <div class="grid gap-2">
            <div class="p-input-icon-left w-full">
              <FloatLabel variant="on">
                <IconField>
                  <InputIcon><Mail class="h-4 w-4"/></InputIcon>
                  <InputText
                      type="email"
                      id="login"
                      v-model="formData.login"
                      :invalid="showLoginError"
                      aria-describedby="login-error"
                      fluid
                      required
                  />
                </IconField>
                <label for="login" class="text-primary">Email</label>
              </FloatLabel>
            </div>
            <small v-if="errors.login && showLoginError" id="login-error" class="p-error">{{ errors.login }}</small>
          </div>

          <!-- Champ Mot de passe -->
          <div class="grid gap-2">
            <div class="flex items-center justify-end">
              <RouterLink to="forget-password">
                Mot de passe oublié ?
              </RouterLink>
            </div>
            <FloatLabel variant="on">
              <IconField>
                <InputIcon><Key class="h-4 w-4"/></InputIcon>
                <Password
                    id="pwd"
                    v-model="formData.password"
                    :invalid="showPasswordError"
                    :feedback="false"
                    aria-describedby="pwd-error"
                    required
                    toggleMask
                    fluid
                />
              </IconField>
              <label for="pwd" class="text-primary">Mot de passe</label>
            </FloatLabel>
            <small v-if="errors.password && showPasswordError" id="pwd-error" class="p-error">{{ errors.password }}</small>
          </div>

          <!-- Bouton de connexion -->
          <Button
              type="submit"
              label="Connexion"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              fluid
          >
            <template #icon>
              <LogIn class="h-4 w-4" />
            </template>
          </Button>
        </div>

        <Divider/>

        <!-- Lien d'inscription -->
        <div class="text-center">
          Vous n'avez pas encore de compte ?
          <div>
            <RouterLink to="register">
              Inscrivez-vous
            </RouterLink>
          </div>
        </div>
      </form>
    </template>
  </Card>
</template>

<style scoped>
:deep([invalid="true"]),
:deep(.p-invalid) {
  border-color: var(--red-500) !important;
}
</style>
