<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { cn } from '@/lib/utils'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import FloatLabel from 'primevue/floatlabel'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import { Mail, RefreshCw } from 'lucide-vue-next'

const COOLDOWN_TIME = 5 * 60 * 1000 // 5 minutes en millisecondes
const LOCAL_STORAGE_KEY = 'password_reset_timestamp'

const store = useStore()
const router = useRouter()
const toast = useToast()

// États réactifs
const formData = reactive({
  email: ''
})
const errors = reactive({
  email: ''
})
const isSubmitting = ref(false)
const isFormSubmitted = ref(false)
const lastRequestTime = ref(null)
const remainingTime = ref(0)
const timerInterval = ref(null)

// Computed properties pour l'invalidation des champs
const showEmailError = computed(() => isFormSubmitted.value && errors.email)

// Vérifier s'il existe un timestamp dans le localStorage
onMounted(() => {
  const savedTimestamp = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (savedTimestamp) {
    const timestamp = parseInt(savedTimestamp)
    const now = Date.now()
    const elapsed = now - timestamp

    if (elapsed < COOLDOWN_TIME) {
      lastRequestTime.value = timestamp
      remainingTime.value = Math.ceil((COOLDOWN_TIME - elapsed) / 1000)
      startTimer()

      // Afficher un toast d'avertissement si l'utilisateur doit attendre
      toast.add({
        severity: 'warn',
        summary: 'Attention',
        detail: `Vous avez récemment effectué une demande de réinitialisation. Veuillez attendre ${formattedRemainingTime.value} avant de faire une nouvelle demande.`,
        life: 5000
      })
    } else {
      // Le temps d'attente est écoulé, on peut nettoyer le localStorage
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  }
})

onUnmounted(() => {
  clearInterval(timerInterval.value)
})

// Démarrer le compte à rebours
const startTimer = () => {
  // Nettoyer tout timer existant
  clearInterval(timerInterval.value)

  timerInterval.value = setInterval(() => {
    remainingTime.value--

    if (remainingTime.value <= 0) {
      clearInterval(timerInterval.value)
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      lastRequestTime.value = null
    }
  }, 1000)
}

// Formater le temps restant en minutes:secondes
const formattedRemainingTime = computed(() => {
  const minutes = Math.floor(remainingTime.value / 60)
  const seconds = remainingTime.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Vérifier si l'utilisateur peut faire une demande
const canRequestReset = computed(() => {
  return remainingTime.value <= 0
})

// Validation de l'email
const validateEmail = (email) => {
  if (!email) return 'L\'email est requis'

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'Veuillez entrer un email valide'

  return ''
}

// Validation du formulaire
const validateForm = () => {
  isFormSubmitted.value = true
  errors.email = validateEmail(formData.email)

  if (errors.email) {
    toast.add({
      severity: 'error',
      summary: 'Erreur de validation',
      detail: errors.email,
      life: 5000
    })
    return false
  }

  return true
}

const handleSubmit = async () => {
  // Vérifier si le formulaire est valide
  if (!validateForm()) return

  // Vérifier si l'utilisateur est en periode de cooldown
  if (!canRequestReset.value) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: `Merci d'attendre ${formattedRemainingTime.value} avant de faire une nouvelle demande.`,
      life: 5000
    })
    return
  }

  isSubmitting.value = true

  try {
    const result = await store.dispatch('auth/forgotPassword', { email: formData.email })
    if (result.success) {
      // Afficher un toast de succès
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Vous allez recevoir un email avec un lien pour réinitialiser votre mot de passe si cet email est associé à un compte.',
        life: 10000
      })

      // Rediriger vers la page de connexion
      router.push('/login')

      // Enregistrer le timestamp de la demande
      const now = Date.now()
      localStorage.setItem(LOCAL_STORAGE_KEY, now.toString())
      lastRequestTime.value = now
      remainingTime.value = COOLDOWN_TIME / 1000
      startTimer()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: result.error || "Erreur lors de la réinitialisation",
        life: 5000
      })
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: "Une erreur est survenue lors de la demande",
      life: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Card>
    <template #content>
      <form @submit.prevent="handleSubmit" :class="cn('flex flex-col gap-4')">
        <div class="flex flex-col items-center gap-2 text-center">
          <h1 class="text-xl font-bold">
            Mot de passe oublié ?
          </h1>
          <p class="text-balance text-sm">
            Entrez votre email pour réinitialiser votre mot de passe
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
                    id="email"
                    v-model="formData.email"
                    :invalid="showEmailError"
                    aria-describedby="email-error"
                    fluid
                    required
                  />
                </IconField>
                <label for="email" class="text-primary">Email</label>
              </FloatLabel>
            </div>
            <small v-if="errors.email && showEmailError" id="email-error" class="p-error">{{ errors.email }}</small>
          </div>

          <!-- Bouton de réinitialisation -->
          <Button
            type="submit"
            :label="canRequestReset ? 'Réinitialiser le mot de passe' : `Attendre ${formattedRemainingTime}`"
            :loading="isSubmitting"
            :disabled="isSubmitting || !canRequestReset"
            fluid
            :title="!canRequestReset ? `Veuillez attendre ${formattedRemainingTime} avant de faire une nouvelle demande` : ''"
          >
            <template #icon>
              <RefreshCw class="h-4 w-4" />
            </template>
          </Button>
        </div>

        <Divider/>

        <!-- Lien de connexion -->
        <div class="text-center">
          Vous avez déjà un compte ?
          <div>
            <RouterLink to="/login" class="animate">
              Connectez-vous
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
