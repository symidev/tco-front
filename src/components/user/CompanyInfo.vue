<script setup>
import {computed} from 'vue'
import {Building, Mail, Hash, Percent} from 'lucide-vue-next'
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
  },
  validationActive: {
    type: Boolean,
    default: false
  }
})

// Validation du SIRET
const isSiretValid = computed(() => {
  return !props.formData.user_siret || (props.formData.user_siret.length === 14 && /^\d{14}$/.test(props.formData.user_siret))
})

// Validation du téléphone
const isTelValid = computed(() => {
  return !props.formData.user_tel || (props.formData.user_tel.length === 10 && /^\d{10}$/.test(props.formData.user_tel))
})

// Validation des champs d'intérêt et de connaissance
const isOffreValid = computed(() => {
  return props.formData.user_offre && props.formData.user_offre.length > 0
})

const isConnaissanceValid = computed(() => {
  return props.formData.user_connaissance && props.formData.user_connaissance.length > 0
})

// Computed pour l'affichage des erreurs
const showSiretError = computed(() => props.validationActive && !isSiretValid.value)
const showTelError = computed(() => props.validationActive && !isTelValid.value)
const showOffreError = computed(() => props.validationActive && !isOffreValid.value)
const showConnaissanceError = computed(() => props.validationActive && !isConnaissanceValid.value)

// Fonction pour normaliser la saisie du SIRET (seulement des chiffres)
const handleSiretInput = (event) => {
  // Supprimer tous les caractères non numériques
  const value = event.target.value.replace(/\D/g, '')
  // Limiter à 14 chiffres
  const truncated = value.substring(0, 14)
  // Mettre à jour le modèle
  props.formData.user_siret = truncated
}

// Fonction pour normaliser la saisie du téléphone (seulement des chiffres)
const handleTelInput = (event) => {
  // Supprimer tous les caractères non numériques
  const value = event.target.value.replace(/\D/g, '')
  // Limiter à 10 chiffres
  const truncated = value.substring(0, 10)
  // Mettre à jour le modèle
  props.formData.user_tel = truncated
}

// Exposer les méthodes de validation
defineExpose({
  validateSiret: () => isSiretValid.value,
  validateTel: () => isTelValid.value,
  validateOffre: () => isOffreValid.value,
  validateConnaissance: () => isConnaissanceValid.value,
  validate: () => isSiretValid.value && isTelValid.value && isOffreValid.value && isConnaissanceValid.value
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

</script>

<template>
  <Card class="shadow-sm mb-4">
    <template #title>
      <div class="flex items-center gap-2 text-primary">
        <Building class="w-5 h-5"/>
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
            <span
                class="text-xs text-primary italic">(Pour modifier votre email, veuillez contacter l'administrateur)</span>
          </div>
        </div>
        <!-- Raison sociale -->
        <div class="grid gap-2">
          <FloatLabel variant="in">
            <IconField>
              <InputIcon>
                <Building class="h-4 w-4"/>
              </InputIcon>
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
              <InputIcon>
                <Hash class="h-4 w-4"/>
              </InputIcon>
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
        <!-- IS par défaut -->
        <div class="grid gap-2">
          <FloatLabel variant="in">
            <IconField>
              <InputIcon>
                <Percent class="h-4 w-4"/>
              </InputIcon>
              <InputText
                  id="user_is"
                  v-model="props.formData.user_is"
                  type="number"
                  fluid
              />
            </IconField>
            <label for="user_is" class="text-primary">IS par défaut</label>
          </FloatLabel>
        </div>

        <!-- Charge patronale par défaut -->
        <div class="grid gap-2">
          <FloatLabel variant="in">
            <IconField>
              <InputIcon>
                <Percent class="h-4 w-4"/>
              </InputIcon>
              <InputText
                  id="user_charge_patronale"
                  v-model="props.formData.user_charge_patronale"
                  type="number"
                  fluid
              />
            </IconField>
            <label for="user_charge_patronale" class="text-primary">Charge patronale par défaut</label>
          </FloatLabel>
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
