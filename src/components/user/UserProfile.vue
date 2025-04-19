<script setup>
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import CompanyInfo from './CompanyInfo.vue'
import CommercialInfo from './CommercialInfo.vue'
import AccountingInfo from './AccountingInfo.vue'
import { useUserProfile } from '@/composables/useUserProfile'

// Utilisation du composable pour la logique
const {
  isLoading,
  isSaving,
  formData,
  showComptableInfo,
  loadUserData,
  saveProfile,
  toggleComptableInfo
} = useUserProfile()

// Chargement des données au montage du composant
onMounted(() => {
  loadUserData()
})
</script>

<template>
  <div class="w-full max-w-full px-2 sm:px-4 space-y-6">
    <div v-if="isLoading" class="w-full flex justify-center my-8">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <form v-else @submit.prevent="saveProfile" class="space-y-8">
      <!-- Sections d'informations -->
      <CompanyInfo :form-data="formData" />
      <CommercialInfo :form-data="formData" />
      <AccountingInfo
          :form-data="formData"
          :show-comptable-info="showComptableInfo"
          @update:show-comptable-info="toggleComptableInfo"
      />

      <!-- Bouton de soumission -->
      <div class="flex flex-col sm:flex-row sm:justify-end gap-4">
        <button type="button" class="btn btn-secondary w-full sm:w-auto" @click="loadUserData()">
          Réinitialiser
        </button>
        <button type="submit" class="btn btn-primary w-full sm:w-auto" :disabled="isSaving">
          <span v-if="isSaving" class="loading loading-spinner loading-xs mr-2"></span>
          {{ isSaving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
        </button>
      </div>
    </form>
  </div>
</template>
