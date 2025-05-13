<script setup>
import { computed } from 'vue'
import { Building, Mail, Hash } from 'lucide-vue-next'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import FloatLabel from 'primevue/floatlabel'

// Props
const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
})

// Computed properties
const isOtherKnowledgeSelected = computed(() => {
  return props.formData.user_connaissance.includes('autre')
})

// Options for interests
const interetOptions = [
  {value: 'comparo', label: 'TCO Comparator'},
  {value: 'catalogue', label: 'TCO creator'},
]

// Options for knowledge channels
const connaissanceOptions = [
  {value: 'recommandation', label: 'Recommandation'},
  {value: 'linkedin', label: 'Linkedin'},
  {value: 'instagram', label: 'Instagram'},
  {value: 'facebook', label: 'Facebook'},
  {value: 'autre', label: 'Autre'}
]

// Fonctions pour contrôler la saisie du SIRET
const handleSiretInput = (event) => {
  // Supprimer tous les caractères non numériques
  const value = event.target.value.replace(/\D/g, '')

  // Limiter à 14 chiffres
  const truncated = value.substring(0, 14)

  // Mettre à jour le modèle
  props.formData.user_siret = truncated
}
</script>

<template>
  <Card class="shadow-sm mb-4">
    <template #title>
      <div class="flex items-center gap-2 text-primary">
        <Building class="w-5 h-5" />
        <h2>Informations Société</h2>
      </div>
    </template>

    <template #content>
      <div class="grid gap-6">
        <!-- Email (non modifiable) -->
        <div class="grid gap-2 col-span-1 md:col-span-2">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <label class="text-primary font-medium">Email :</label>
            <div class="text-sm">{{ props.formData.email }}</div>
            <span class="text-xs text-primary italic">(Pour modifier votre email, veuillez contacter l'administrateur)</span>
          </div>
        </div>

        <!-- Raison sociale -->
        <div class="grid gap-2">
          <FloatLabel variant="in">
            <IconField>
              <InputIcon><Building class="h-4 w-4"/></InputIcon>
              <InputText
                id="raison_sociale"
                v-model="formData.user_raison_sociale"
                fluid
              />
            </IconField>
            <label for="raison_sociale" class="text-primary">Raison sociale</label>
          </FloatLabel>
        </div>

        <!-- SIRET -->
        <div class="grid gap-2">
          <FloatLabel variant="in">
            <IconField>
              <InputIcon><Hash class="h-4 w-4"/></InputIcon>
              <InputText
                id="siret"
                v-model="formData.user_siret"
                maxlength="14"
                @input="handleSiretInput"
                fluid
              />
            </IconField>
            <label for="siret" class="text-primary">SIRET</label>
          </FloatLabel>
        </div>

        <!-- Intérêt offre -->
        <div class="grid gap-2 mt-2">
          <label class="text-primary">Intérêt offre</label>
          <div class="flex flex-col gap-2">
            <div v-for="option in interetOptions" :key="option.value" class="flex items-center gap-1">
              <Checkbox
                :id="`interet-${option.value}`"
                :value="option.value"
                v-model="formData.user_offre"
              />
              <label :for="`interet-${option.value}`" class="text-sm">{{ option.label }}</label>
            </div>
          </div>
        </div>

        <!-- Canal de connaissance -->
        <div class="grid gap-2 mt-2">
          <label class="text-primary">Canal de connaissance</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
            <!-- Options normales (sauf "autre") -->
            <div
              v-for="option in connaissanceOptions.filter(opt => opt.value !== 'autre')"
              :key="option.value"
              class="flex items-center gap-1"
            >
              <Checkbox
                :id="`connaissance-${option.value}`"
                :value="option.value"
                v-model="formData.user_connaissance"
              />
              <label :for="`connaissance-${option.value}`" class="text-sm">{{ option.label }}</label>
            </div>

            <!-- Option "autre" sur toute la largeur -->
            <div
              v-if="connaissanceOptions.some(opt => opt.value === 'autre')"
              class="flex items-center col-span-1 sm:col-span-2 gap-1"
            >
              <Checkbox
                id="connaissance-autre"
                value="autre"
                v-model="formData.user_connaissance"
              />
              <label for="connaissance-autre" class="text-sm">
                {{ connaissanceOptions.find(opt => opt.value === 'autre')?.label || 'Autre' }}
              </label>

              <InputText
                v-if="isOtherKnowledgeSelected"
                v-model="formData.user_connaissance_autre"
                size="small"
                class="ml-2 flex-grow"
                placeholder="Précisez..."
                fluid
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
:deep(.p-inputtext),
:deep(.p-password),
:deep(.p-password-input) {
  width: 100%;
}

:deep([invalid="true"]),
:deep(.p-invalid) {
  border-color: var(--red-500) !important;
}
</style>
