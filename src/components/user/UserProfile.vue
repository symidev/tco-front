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
  <div class="gap-3 w-full flex justify-center">
    <div class="w-full max-w-[1200px] flex flex-1 flex-col my-8">
      <ProgressSpinner v-if="isLoading" style="width:50px;height:50px" strokeWidth="5"/>
      <form v-else @submit.prevent="saveProfile" class="grid">
        <!-- Sections d'informations -->
        <CompanyInfo
            :form-data="formData"
            ref="companyInfoRef"
            :validationActive="validationActive"
        />
        <CommercialInfo
            :form-data="formData"
            ref="commercialInfoRef"
            :validationActive="validationActive"
        />
        <AccountingInfo
            :form-data="formData"
            ref="accountingInfoRef"
            :validationActive="validationActive"
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

