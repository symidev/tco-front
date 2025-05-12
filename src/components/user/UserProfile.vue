<script setup>
import {ref, computed, onMounted} from 'vue'
import {toast} from 'vue-sonner'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Card from 'primevue/card'
import CompanyInfo from './CompanyInfo.vue'
import CommercialInfo from './CommercialInfo.vue'
import AccountingInfo from './AccountingInfo.vue'
import {useUserProfile} from '@/composables/useUserProfile'
import {RefreshCw, Save} from 'lucide-vue-next'

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
  <div class="gap-3 w-full flex justify-center">
    <div class="w-full max-w-[700px] flex flex-1 flex-col my-8">
      <ProgressSpinner v-if="isLoading" style="width:50px;height:50px" strokeWidth="5"/>
      <form v-else @submit.prevent="saveProfile" class="grid">
        <!-- Sections d'informations -->
        <CompanyInfo :form-data="formData"/>
        <CommercialInfo :form-data="formData"/>
        <AccountingInfo
            :form-data="formData"
            :show-comptable-info="showComptableInfo"
            @update:show-comptable-info="toggleComptableInfo"
        />

        <!-- Boutons d'action -->
        <div class="flex justify-between gap-4">
          <Button
              type="button"
              outlined
              severity="secondary"
              @click="loadUserData()"
              class="w-full sm:w-auto"
              fluid
          >
            <RefreshCw class="h-4 w-4 mr-2"/>
            Réinitialiser
          </Button>
          <Button
              type="submit"
              severity="primary"
              :disabled="isSaving"
              class="w-full sm:w-auto"
              fluid
          >
              <ProgressSpinner v-if="isSaving" style="width:16px;height:16px" strokeWidth="8" class="mr-2"/>
              <Save v-else class="h-4 w-4 mr-2"/>
            {{ isSaving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

