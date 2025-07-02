<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Card from 'primevue/card'
import CompanyInfo from './CompanyInfo.vue'
import CommercialInfo from './CommercialInfo.vue'
import AccountingInfo from './AccountingInfo.vue'
import {useUserProfile} from '@/composables/useUserProfile'
import {RefreshCw, Save} from 'lucide-vue-next'
import {useToast} from 'primevue/usetoast'

const toast = useToast()

// Utilisation du composable pour la logique
const {
  isLoading,
  isSaving,
  formData,
  showComptableInfo,
  loadUserData,
  saveProfile,
  toggleComptableInfo,
  validationActive,
  setCompanyInfoRef,
  setCommercialInfoRef,
  setAccountingInfoRef
} = useUserProfile(toast)

// Création des références locales
const companyInfoRef = ref(null)
const commercialInfoRef = ref(null)
const accountingInfoRef = ref(null)

// Chargement des données au montage du composant
onMounted(() => {
  loadUserData()
})

// Utiliser watch pour s'assurer que les références sont mises à jour correctement
// quand les composants sont montés
watch(companyInfoRef, (newValue) => {
  if (newValue) setCompanyInfoRef(newValue)
}, { immediate: true })

watch(commercialInfoRef, (newValue) => {
  if (newValue) setCommercialInfoRef(newValue)
}, { immediate: true })

watch(accountingInfoRef, (newValue) => {
  if (newValue) setAccountingInfoRef(newValue)
}, { immediate: true })
</script>

<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="loading-container">
    <div class="loading-card">
      <ProgressSpinner class="loading-spinner" />
      <p class="loading-text">Chargement des informations...</p>
    </div>
  </div>

  <!-- Content -->
  <div v-else class="animate-slide-in-up">
    <form @submit.prevent="saveProfile" class="space-y-6">
      <!-- Sections d'informations -->
      <div class="space-y-4">
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <h2>Informations entreprise</h2>
            </div>
          </div>
          <div class="section-content">
            <CompanyInfo
                :form-data="formData"
                ref="companyInfoRef"
                :validationActive="validationActive"
            />
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <h2>Informations commerciales</h2>
            </div>
          </div>
          <div class="section-content">
            <CommercialInfo
                :form-data="formData"
                ref="commercialInfoRef"
                :validationActive="validationActive"
            />
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <h2>Informations comptables</h2>
            </div>
          </div>
          <div class="section-content">
            <AccountingInfo
                :form-data="formData"
                ref="accountingInfoRef"
                :validationActive="validationActive"
                :show-comptable-info="showComptableInfo"
                @update:show-comptable-info="toggleComptableInfo"
            />
          </div>
        </div>
      </div>

      <!-- Boutons d'action -->
      <div class="section-card">
        <div class="section-content">
          <div class="flex flex-col sm:flex-row justify-between gap-4">
            <Button
                type="button"
                outlined
                severity="secondary"
                @click="loadUserData()"
                class="btn-primary flex-1 sm:flex-none sm:w-auto"
            >
              <RefreshCw class="h-4 w-4 mr-2"/>
              Réinitialiser
            </Button>
            <Button
                type="submit"
                severity="primary"
                :disabled="isSaving"
                class="btn-primary flex-1 sm:flex-none sm:w-auto"
            >
                <ProgressSpinner v-if="isSaving" style="width:16px;height:16px" strokeWidth="8" class="mr-2"/>
                <Save v-else class="h-4 w-4 mr-2"/>
              {{ isSaving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </Button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.loading-spinner {
  margin-bottom: 1rem;
}

.section-card {
  animation: slideInUp 0.6s ease-out;
  animation-fill-mode: both;
}

.section-card:nth-child(1) { animation-delay: 0.1s; }
.section-card:nth-child(2) { animation-delay: 0.2s; }
.section-card:nth-child(3) { animation-delay: 0.3s; }
.section-card:nth-child(4) { animation-delay: 0.4s; }

/* Amélioration des composants de formulaire */
:deep(.p-card) {
  box-shadow: none !important;
  border: none !important;
}

:deep(.p-card-content) {
  padding: 0 !important;
}
</style>

