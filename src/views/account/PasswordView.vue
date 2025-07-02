<script setup>
import { ref, computed, reactive } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'primevue/usetoast'
import { cn } from '@/lib/utils'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import FloatLabel from 'primevue/floatlabel'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { Lock, Key, CheckCircle2 } from 'lucide-vue-next'

const store = useStore()
const toast = useToast()

// Check if this is coming from auto-connect
const isAutoConnect = computed(() => store.state.auth.isAutoConnect)

// Form data
const formData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Loading state
const isLoading = ref(false)

// Success state
const isSuccess = ref(false)

// Form errors
const errors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Form submission state
const isFormSubmitted = ref(false)

// Computed properties pour l'invalidation des champs
const showCurrentPasswordError = computed(() => isFormSubmitted.value && errors.currentPassword)
const showNewPasswordError = computed(() => isFormSubmitted.value && errors.newPassword)
const showConfirmPasswordError = computed(() => isFormSubmitted.value && errors.confirmPassword)

// Validate form fields
const validateField = (field) => {
  switch (field) {
    case 'currentPassword':
      // Skip validation for currentPassword if coming from auto-connect
      if (isAutoConnect.value) {
        errors.currentPassword = ''
        break
      }

      if (!formData.currentPassword) {
        errors.currentPassword = "Le mot de passe actuel est requis"
      } else {
        errors.currentPassword = ''
      }
      break

    case 'newPassword':
      if (!formData.newPassword) {
        errors.newPassword = "Le nouveau mot de passe est requis"
      } else if (formData.newPassword.length < 8) {
        errors.newPassword = "Le mot de passe doit contenir au moins 8 caractères"
      } else if (!/[a-z]/.test(formData.newPassword)) {
        errors.newPassword = "Le mot de passe doit contenir au moins une lettre minuscule"
      } else if (!/[A-Z]/.test(formData.newPassword)) {
        errors.newPassword = "Le mot de passe doit contenir au moins une lettre majuscule"
      } else if (!/[0-9]/.test(formData.newPassword)) {
        errors.newPassword = "Le mot de passe doit contenir au moins un chiffre"
      } else if (!/[^a-zA-Z0-9]/.test(formData.newPassword)) {
        errors.newPassword = "Le mot de passe doit contenir au moins un caractère spécial"
      } else {
        errors.newPassword = ''
      }
      break

    case 'confirmPassword':
      if (!formData.confirmPassword) {
        errors.confirmPassword = "La confirmation du mot de passe est requise"
      } else if (formData.confirmPassword !== formData.newPassword) {
        errors.confirmPassword = "Les mots de passe ne correspondent pas"
      } else {
        errors.confirmPassword = ''
      }
      break
  }
}

// Validate all form fields
const validateForm = () => {
  isFormSubmitted.value = true

  // For auto-connect, skip currentPassword validation
  if (!isAutoConnect.value) {
    validateField('currentPassword')
  }

  validateField('newPassword')
  validateField('confirmPassword')

  return Object.values(errors).every(error => error === '')
}

// Handle form submission
const changePassword = async () => {
  // Hide success message when attempting a new submission
  isSuccess.value = false

  // Validate form
  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    // Different API call depending on isAutoConnect
    let result
    if (isAutoConnect.value) {
      result = await store.dispatch('user/changePasswordAfterAutoConnect', {
        newPassword: formData.newPassword
      })

      // Reset auto-connect flag if successful
      if (result.success) {
        store.commit('auth/setIsAutoConnect', false)
      }
    } else {
      result = await store.dispatch('user/changePassword', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
    }

    if (result.success) {
      // Reset form
      formData.currentPassword = ''
      formData.newPassword = ''
      formData.confirmPassword = ''

      // Show success message
      isSuccess.value = true

      toast.add({
        severity: 'success',
        summary: 'Mot de passe mis à jour',
        detail: 'Votre mot de passe a été changé avec succès.',
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Erreur lors du changement de mot de passe',
        detail: result.error || 'Une erreur est survenue lors du changement de votre mot de passe.',
        life: 5000
      })
    }
  } catch (error) {
    console.error('Change password error:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur lors du changement de mot de passe',
      detail: 'Une erreur inattendue est survenue.',
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="animate-slide-in-up">
    <div class="section-card">
      <div class="section-header">
        <div class="section-title">
          <Lock class="section-icon" />
          <h2>Changer mon mot de passe</h2>
        </div>
      </div>

      <div class="section-content m-6">
        <!-- Success message -->
        <Message v-if="isSuccess" severity="success" class="mb-4">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-5 h-5" />
            <span>Votre mot de passe a été mis à jour avec succès!</span>
          </div>
        </Message>

        <form @submit.prevent="changePassword" :class="cn('flex flex-col gap-4 mt-4')">
          <div class="grid gap-6">
            <!-- Mot de passe actuel -->
            <div v-if="!isAutoConnect" class="grid gap-2">
              <FloatLabel variant="in">
                <IconField>
                  <InputIcon><Key class="h-4 w-4"/></InputIcon>
                  <Password
                    id="currentPassword"
                    v-model="formData.currentPassword"
                    :invalid="showCurrentPasswordError"
                    :feedback="false"
                    aria-describedby="current-pwd-error"
                    @blur="validateField('currentPassword')"
                    toggleMask
                    fluid
                  />
                </IconField>
                <label for="currentPassword" class="text-primary">Mot de passe actuel</label>
              </FloatLabel>
              <small v-if="showCurrentPasswordError" id="current-pwd-error" class="p-error">{{ errors.currentPassword }}</small>
            </div>

            <!-- Nouveau mot de passe -->
            <div class="grid gap-2">
              <FloatLabel variant="in">
                <IconField>
                  <InputIcon><Key class="h-4 w-4"/></InputIcon>
                  <Password
                    id="newPassword"
                    v-model="formData.newPassword"
                    :invalid="showNewPasswordError"
                    :feedback="false"
                    aria-describedby="new-pwd-error"
                    @blur="validateField('newPassword')"
                    toggleMask
                    fluid
                  />
                </IconField>
                <label for="newPassword" class="text-primary">Nouveau mot de passe</label>
              </FloatLabel>
              <small v-if="showNewPasswordError" id="new-pwd-error" class="p-error">{{ errors.newPassword }}</small>
              <small v-else class="text-sm opacity-75">
                Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
              </small>
            </div>

            <!-- Confirmation du mot de passe -->
            <div class="grid gap-2">
              <FloatLabel variant="in">
                <IconField>
                  <InputIcon><Key class="h-4 w-4"/></InputIcon>
                  <Password
                    id="confirmPassword"
                    v-model="formData.confirmPassword"
                    :invalid="showConfirmPasswordError"
                    :feedback="false"
                    aria-describedby="confirm-pwd-error"
                    @blur="validateField('confirmPassword')"
                    toggleMask
                    fluid
                  />
                </IconField>
                <label for="confirmPassword" class="text-primary">Confirmez le nouveau mot de passe</label>
              </FloatLabel>
              <small v-if="showConfirmPasswordError" id="confirm-pwd-error" class="p-error">{{ errors.confirmPassword }}</small>
            </div>

            <!-- Bouton de soumission -->
            <div class="flex justify-end mt-4">
              <Button
                type="submit"
                :label="isLoading ? 'En cours...' : 'Changer le mot de passe'"
                :loading="isLoading"
                :disabled="isLoading"
                class="btn-primary sm:w-auto w-full"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep([invalid="true"]),
:deep(.p-invalid) {
  border-color: var(--red-500) !important;
}

.section-card {
  animation: slideInUp 0.6s ease-out;
  animation-fill-mode: both;
}

/* Amélioration des composants de formulaire */
:deep(.p-card) {
  box-shadow: none !important;
  border: none !important;
}

:deep(.p-card-content) {
  padding: 0 !important;
}
</style>
