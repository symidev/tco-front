<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { toast } from 'vue-sonner'
import { Lock, CheckCircle } from 'lucide-vue-next'

const store = useStore()

// Check if this is coming from auto-connect
const isAutoConnect = computed(() => store.state.auth.isAutoConnect)

// Form data
const formData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Loading state
const isLoading = ref(false)

// Success state
const isSuccess = ref(false)

// Form errors
const errors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Validate form fields
const validateField = (field) => {
  switch (field) {
    case 'currentPassword':
      // Skip validation for currentPassword if coming from auto-connect
      if (isAutoConnect.value) {
        errors.value.currentPassword = ''
        break
      }
      
      if (!formData.value.currentPassword) {
        errors.value.currentPassword = "Le mot de passe actuel est requis"
      } else {
        errors.value.currentPassword = ''
      }
      break

    case 'newPassword':
      if (!formData.value.newPassword) {
        errors.value.newPassword = "Le nouveau mot de passe est requis"
      } else if (formData.value.newPassword.length < 8) {
        errors.value.newPassword = "Le mot de passe doit contenir au moins 8 caractères"
      } else if (!/[a-z]/.test(formData.value.newPassword)) {
        errors.value.newPassword = "Le mot de passe doit contenir au moins une lettre minuscule"
      } else if (!/[A-Z]/.test(formData.value.newPassword)) {
        errors.value.newPassword = "Le mot de passe doit contenir au moins une lettre majuscule"
      } else if (!/[0-9]/.test(formData.value.newPassword)) {
        errors.value.newPassword = "Le mot de passe doit contenir au moins un chiffre"
      } else if (!/[^a-zA-Z0-9]/.test(formData.value.newPassword)) {
        errors.value.newPassword = "Le mot de passe doit contenir au moins un caractère spécial"
      } else {
        errors.value.newPassword = ''
      }
      break

    case 'confirmPassword':
      if (!formData.value.confirmPassword) {
        errors.value.confirmPassword = "La confirmation du mot de passe est requise"
      } else if (formData.value.confirmPassword !== formData.value.newPassword) {
        errors.value.confirmPassword = "Les mots de passe ne correspondent pas"
      } else {
        errors.value.confirmPassword = ''
      }
      break
  }
}

// Validate all form fields
const validateForm = () => {
  // For auto-connect, skip currentPassword validation
  if (!isAutoConnect.value) {
    validateField('currentPassword')
  }
  
  validateField('newPassword')
  validateField('confirmPassword')

  return Object.values(errors.value).every(error => error === '')
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
        newPassword: formData.value.newPassword
      })
      
      // Reset auto-connect flag if successful
      if (result.success) {
        store.commit('auth/setIsAutoConnect', false)
      }
    } else {
      result = await store.dispatch('user/changePassword', {
        currentPassword: formData.value.currentPassword,
        newPassword: formData.value.newPassword
      })
    }

    if (result.success) {
      // Reset form
      formData.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }

      // Show success message
      isSuccess.value = true

      toast.success('Mot de passe mis à jour', {
        description: 'Votre mot de passe a été changé avec succès.',
      })
    } else {
      toast.error('Erreur lors du changement de mot de passe', {
        description: result.error || 'Une erreur est survenue lors du changement de votre mot de passe.',
      })
    }
  } catch (error) {
    console.error('Change password error:', error)
    toast.error('Erreur lors du changement de mot de passe', {
      description: 'Une erreur inattendue est survenue.',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto px-2 sm:px-0">
    <div class="card bg-base-200 shadow-sm">
      <div class="card-body">
        <h2 class="card-title flex items-center gap-2">
          <Lock class="w-5 h-5" />
          Changer mon mot de passe
        </h2>

        <!-- Success message -->
        <div v-if="isSuccess" class="alert alert-success mb-4 flex items-center gap-2">
          <CheckCircle class="w-5 h-5" />
          <span>Votre mot de passe a été mis à jour avec succès!</span>
        </div>

        <form @submit.prevent="changePassword" class="mt-6 space-y-4">
          <div v-if="!isAutoConnect" class="form-control w-full">
            <label class="label">
              <span class="label-text">Mot de passe actuel</span>
            </label>
            <input
                v-model="formData.currentPassword"
                type="password"
                class="input input-bordered w-full"
                placeholder="Entrez votre mot de passe actuel"
                @blur="validateField('currentPassword')"
                :class="{'input-error': errors.currentPassword}"
            />
            <label v-if="errors.currentPassword" class="label">
              <span class="label-text-alt text-error">{{ errors.currentPassword }}</span>
            </label>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">Nouveau mot de passe</span>
            </label>
            <input
                v-model="formData.newPassword"
                type="password"
                class="input input-bordered w-full"
                placeholder="Entrez votre nouveau mot de passe"
                @blur="validateField('newPassword')"
                :class="{'input-error': errors.newPassword}"
            />
            <label v-if="errors.newPassword" class="label">
              <span class="label-text-alt text-error">{{ errors.newPassword }}</span>
            </label>
            <label v-else class="label">
              <span class="label-text-alt text-primary whitespace-normal break-words">
                Le mot de passe doit contenir au moins 8 caractères, une majuscule,
                une minuscule, un chiffre et un caractère spécial.
              </span>
            </label>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">Confirmez le nouveau mot de passe</span>
            </label>
            <input
                v-model="formData.confirmPassword"
                type="password"
                class="input input-bordered w-full"
                placeholder="Confirmez votre nouveau mot de passe"
                @blur="validateField('confirmPassword')"
                :class="{'input-error': errors.confirmPassword}"
            />
            <label v-if="errors.confirmPassword" class="label">
              <span class="label-text-alt text-error">{{ errors.confirmPassword }}</span>
            </label>
          </div>

          <div class="flex flex-col sm:flex-row sm:justify-end mt-6">
            <button type="submit" class="btn btn-primary w-full sm:w-auto" :disabled="isLoading">
              <span v-if="isLoading" class="loading loading-spinner loading-xs mr-2"></span>
              {{ isLoading ? 'En cours...' : 'Changer le mot de passe' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
