<script setup>
import { ref, computed } from 'vue'
import { useToast } from "primevue/usetoast";
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import FloatLabel from 'primevue/floatlabel'
import { Mail, Key, Building, Hash, ArrowRight } from 'lucide-vue-next'

const props = defineProps({
  initialData: {
    type: Object,
    required: true
  },
  activateCallback: {
    type: Function,
    required: true
  }
})

// Fonctions pour contrôler la saisie des champs numériques
const handleSiretInput = (event) => {
  // Supprimer tous les caractères non numériques
  const value = event.target.value.replace(/\D/g, '')

  // Limiter à 14 chiffres
  const truncated = value.substring(0, 14)

  // Mettre à jour le modèle
  formData.value.user_siret = truncated
}

const emit = defineEmits(['update:formData'])
const toast = useToast();
// Variable pour suivre si le formulaire a été soumis
const isSubmitted = ref(false);

// Copie locale des données pour cette étape
const formData = ref({
  email: props.initialData.email || '',
  password: props.initialData.password || '',
  user_raison_sociale: props.initialData.user_raison_sociale || '',
  user_siret: props.initialData.user_siret || '',
  user_connaissance: [...(props.initialData.user_connaissance || [])],
  user_connaissance_autre: props.initialData.user_connaissance_autre || '',
  user_offre: [...(props.initialData.user_offre || [])]
})

// Options pour les intérêts
const interetOptions = [
  {value: 'comparo', label: 'TCO Comparator'},
  {value: 'catalogue', label: 'TCO creator'},
]

// Options pour les canaux de connaissance
const connaissanceOptions = [
  {value: 'recommandation', label: 'Recommandation'},
  {value: 'linkedin', label: 'Linkedin'},
  {value: 'instagram', label: 'Instagram'},
  {value: 'facebook', label: 'Facebook'},
  {value: 'autre', label: 'Autre'}
]

// Vérifier si "autre" est sélectionné dans les canaux de connaissance
const isOtherKnowledgeSelected = computed(() => {
  return formData.value.user_connaissance.includes('autre')
})

// Validation des champs
const isEmailValid = computed(() => {
  return formData.value.email !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)
})

const isPasswordLengthValid = computed(() => formData.value.password.length >= 8)
const hasLowercase = computed(() => /[a-z]/.test(formData.value.password))
const hasUppercase = computed(() => /[A-Z]/.test(formData.value.password))
const hasDigit = computed(() => /[0-9]/.test(formData.value.password))
const hasSpecialChar = computed(() => /[^a-zA-Z0-9]/.test(formData.value.password))

const isPasswordValid = computed(() => {
  return formData.value.password !== '' &&
         isPasswordLengthValid.value &&
         hasLowercase.value &&
         hasUppercase.value &&
         hasDigit.value &&
         hasSpecialChar.value
})

const isRaisonSocialeValid = computed(() => {
  return formData.value.user_raison_sociale !== ''
})
const isSiretValid = computed(() => {
  return formData.value.user_siret !== '' &&
         /^[0-9]{14}$/.test(formData.value.user_siret) &&
         formData.value.user_siret.length === 14
})

const isConnaissanceValid = computed(() => {
  return formData.value.user_connaissance.length > 0 &&
         (!formData.value.user_connaissance.includes('autre') ||
         (formData.value.user_connaissance.includes('autre') && formData.value.user_connaissance_autre))
})

const isOffreValid = computed(() => {
  return formData.value.user_offre.length > 0
})

// Computed properties pour l'affichage conditionnel des erreurs
const showEmailError = computed(() => isSubmitted.value && !isEmailValid.value)
const showPasswordError = computed(() => isSubmitted.value && !isPasswordValid.value)
const showRaisonSocialeError = computed(() => isSubmitted.value && !isRaisonSocialeValid.value)
const showSiretError = computed(() => isSubmitted.value && !isSiretValid.value)
const showConnaissanceError = computed(() => isSubmitted.value && !isConnaissanceValid.value)
const showOffreError = computed(() => isSubmitted.value && !isOffreValid.value)

// Valider tous les champs
const validateForm = () => {
  let isValid = true
  let errorMessage = ''

  if (!isEmailValid.value) {
    isValid = false
    errorMessage = "L'email est requis et doit être valide"
  } else if (!isPasswordValid.value) {
    isValid = false
    errorMessage = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial"
  } else if (!isRaisonSocialeValid.value) {
    isValid = false
    errorMessage = "La raison sociale est requise"
  } else if (!isSiretValid.value) {
    isValid = false
    errorMessage = "Le SIRET est requis et doit contenir 14 chiffres"
  } else if (!isConnaissanceValid.value) {
    isValid = false
    if (formData.value.user_connaissance.length === 0) {
      errorMessage = "Veuillez sélectionner au moins un canal de connaissance"
    } else {
      errorMessage = "Veuillez préciser le canal de connaissance 'Autre'"
    }
  } else if (!isOffreValid.value) {
    isValid = false
    errorMessage = "Veuillez sélectionner au moins un intérêt"
  }

  if (!isValid && errorMessage) {
    toast.add({ severity: 'error', summary: 'Erreur de validation', detail: errorMessage, life: 5000 });
  }

  return isValid
}

// Émettre l'événement pour passer à l'étape suivante
const nextStep = () => {
  isSubmitted.value = true
  const isValid = validateForm()

  // Mettre à jour les données du formulaire parent
  emit('update:formData', formData.value, 1)

  // Passer à l'étape suivante si le formulaire est valide
  if (isValid) {
    props.activateCallback('2')
  }
}
</script>

<template>
  <div class="grid gap-3">
    <!-- Champ Email -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Mail class="h-4 w-4"/></InputIcon>
          <InputText
            id="email"
            v-model="formData.email"
            type="email"
            :invalid="showEmailError"
            required
            fluid
          />
        </IconField>
        <label for="email" class="text-primary">Email</label>
      </FloatLabel>
    </div>

    <!-- Champ Mot de passe -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Key class="h-4 w-4"/></InputIcon>
          <Password
            id="password"
            v-model="formData.password"
            :invalid="showPasswordError"
            :feedback="false"
            required
            toggleMask
            fluid
          />
        </IconField>
        <label for="password" class="text-primary">Mot de passe</label>
      </FloatLabel>
    </div>

    <!-- Champ Raison sociale -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Building class="h-4 w-4"/></InputIcon>
          <InputText
            id="raison_sociale"
            v-model="formData.user_raison_sociale"
            :invalid="showRaisonSocialeError"
            fluid
          />
        </IconField>
        <label for="raison_sociale" class="text-primary">Raison sociale</label>
      </FloatLabel>
    </div>

    <!-- Champ SIRET -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Hash class="h-4 w-4"/></InputIcon>
          <InputText
            id="siret"
            v-model="formData.user_siret"
            :invalid="showSiretError"
            maxlength="14"
            fluid
          />
        </IconField>
        <label for="siret" class="text-primary">SIRET</label>
      </FloatLabel>
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
            :invalid="showConnaissanceError"
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
            :invalid="showConnaissanceError"
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

    <!-- Intérêt offre -->
    <div class="grid gap-2 mt-2">
      <label class="text-primary">Intérêt offre</label>
      <div class="flex flex-col gap-2">
        <div v-for="option in interetOptions" :key="option.value" class="flex items-center gap-1">
          <Checkbox
            :id="`interet-${option.value}`"
            :value="option.value"
            v-model="formData.user_offre"
            :invalid="showOffreError"
          />
          <label :for="`interet-${option.value}`" class="text-sm">{{ option.label }}</label>
        </div>
      </div>
    </div>

    <!-- Bouton Suivant -->
    <div class="text-right">
      <Button
        type="button"
        @click="nextStep"
        label="Suivant"
        class="w-1/2 btn-register mt-3"
        fluid
      >
        <template #icon>
          <ArrowRight class="h-4 w-4" />
        </template>
      </Button>
    </div>
  </div>
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

:deep(.p-checkbox[invalid="true"]) .p-checkbox-box {
  border-color: var(--red-500) !important;
}
</style>
