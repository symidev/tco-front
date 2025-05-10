<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from "primevue/usetoast"
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import FloatLabel from 'primevue/floatlabel'
import { User, Phone, Building, MapPin, Map, ArrowRight, ArrowLeft } from 'lucide-vue-next'

const props = defineProps({
  initialData: {
    type: Object,
    required: true
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  differentAccountingInfo: {
    type: Boolean,
    default: false
  },
  activateCallback: {
    type: Function,
    required: true
  }
})

const emit = defineEmits([
  'update:formData',
  'update:different-accounting',
  'submit'
])

const toast = useToast()
// Variable pour suivre si le formulaire a été soumis
const isSubmitted = ref(false)

// Copie locale des données pour cette étape
const formData = ref({
  commercial_nom: props.initialData.commercial_nom || '',
  commercial_prenom: props.initialData.commercial_prenom || '',
  commercial_fonction: props.initialData.commercial_fonction || '',
  commercial_tel: props.initialData.commercial_tel || '',
  commercial_rue: props.initialData.commercial_rue || '',
  commercial_cp: props.initialData.commercial_cp || '',
  commercial_ville: props.initialData.commercial_ville || ''
})

const differentAccounting = ref(props.differentAccountingInfo)

// Computed properties pour la validation des champs
const isNomValid = computed(() => {
  return formData.value.commercial_nom !== ''
})

const isPrenomValid = computed(() => {
  return formData.value.commercial_prenom !== ''
})

const isTelValid = computed(() => {
  // Simplifier la validation puisque nous garantissons déjà que seuls les chiffres sont saisis
  return formData.value.commercial_tel !== '' && formData.value.commercial_tel.length === 10
})

const isCodePostalValid = computed(() => {
  if (!formData.value.commercial_cp) return true // Champ optionnel
  const cpWithoutSpaces = formData.value.commercial_cp.replace(/\s/g, '')
  return /^\d{5}$/.test(cpWithoutSpaces)
})

// Computed properties pour l'affichage conditionnel des erreurs
const showNomError = computed(() => isSubmitted.value && !isNomValid.value)
const showPrenomError = computed(() => isSubmitted.value && !isPrenomValid.value)
const showTelError = computed(() => isSubmitted.value && !isTelValid.value)
const showCpError = computed(() => isSubmitted.value && !isCodePostalValid.value)

// Fonctions pour contrôler la saisie des champs numériques
const handleTelInput = (event) => {
  // Supprimer tous les caractères non numériques
  const value = event.target.value.replace(/\D/g, '')

  // Limiter à 10 chiffres
  const truncated = value.substring(0, 10)

  // Mettre à jour le modèle
  formData.value.commercial_tel = truncated
}

// Valider tous les champs
const validateForm = () => {
  let isValid = true
  let errorMessage = ''

  if (!isNomValid.value) {
    isValid = false
    errorMessage = "Le nom est requis"
  } else if (!isPrenomValid.value) {
    isValid = false
    errorMessage = "Le prénom est requis"
  } else if (!isTelValid.value) {
    isValid = false
    errorMessage = "Le téléphone est requis et doit être au format valide (ex: 0612345678)"
  } else if (!isCodePostalValid.value) {
    isValid = false
    errorMessage = "Le code postal doit contenir 5 chiffres"
  }

  if (!isValid && errorMessage) {
    toast.add({ severity: 'error', summary: 'Erreur de validation', detail: errorMessage, life: 5000 })
  }

  return isValid
}

// Fonction pour revenir à l'étape précédente
const prevStep = () => {
  // Mettre à jour les données du formulaire parent avant de revenir
  updateFormData()
  props.activateCallback('1')
}

// Fonction pour passer à l'étape suivante
const nextStep = () => {
  isSubmitted.value = true
  const isValid = validateForm()

  // Mettre à jour les données du formulaire parent
  updateFormData()

  // Passer à l'étape suivante si le formulaire est valide
  if (isValid) {
    props.activateCallback('3')
  }
}

// Fonction pour soumettre le formulaire directement (si pas d'étape comptable)
const submitForm = () => {
  isSubmitted.value = true
  const isValid = validateForm()

  // Mettre à jour les données du formulaire parent
  updateFormData()

  // Soumettre si le formulaire est valide
  if (isValid) {
    emit('submit', isValid)
  }
}

// Mettre à jour les données du formulaire parent
const updateFormData = () => {
  emit('update:formData', formData.value, 2)
}

// Mettre à jour l'option des informations comptables différentes
const updateDifferentAccountingInfo = () => {
  emit('update:different-accounting', Boolean(differentAccounting.value))
}

// Écouter les changements de la case à cocher et mettre à jour l'état parent
const handleCheckboxChange = (event) => {
  // Forcer un délai pour s'assurer que differentAccounting.value est mis à jour
  setTimeout(() => {
    updateDifferentAccountingInfo()
  }, 0)
}

// Surveiller directement les changements de differentAccounting
watch(differentAccounting, (newValue) => {
  updateDifferentAccountingInfo()
})
</script>

<template>
  <div class="grid gap-3">
    <h2 class="text-xl font-bold mb-4">Informations commerciales</h2>

    <!-- Champ Nom -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><User class="h-4 w-4"/></InputIcon>
          <InputText
            id="commercial_nom"
            v-model="formData.commercial_nom"
            :invalid="showNomError"
            required
            fluid
          />
        </IconField>
        <label for="commercial_nom" class="text-primary">Nom</label>
      </FloatLabel>
    </div>

    <!-- Champ Prénom -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><User class="h-4 w-4"/></InputIcon>
          <InputText
            id="commercial_prenom"
            v-model="formData.commercial_prenom"
            :invalid="showPrenomError"
            required
            fluid
          />
        </IconField>
        <label for="commercial_prenom" class="text-primary">Prénom</label>
      </FloatLabel>
    </div>

    <!-- Champ Fonction -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Building class="h-4 w-4"/></InputIcon>
          <InputText
            id="commercial_fonction"
            v-model="formData.commercial_fonction"
            fluid
          />
        </IconField>
        <label for="commercial_fonction" class="text-primary">Fonction</label>
      </FloatLabel>
    </div>

    <!-- Champ Téléphone -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Phone class="h-4 w-4"/></InputIcon>
          <InputText
            id="commercial_tel"
            v-model="formData.commercial_tel"
            :invalid="showTelError"
            maxlength="10"
            required
            fluid
          />
        </IconField>
        <label for="commercial_tel" class="text-primary">Téléphone</label>
      </FloatLabel>
    </div>

    <!-- Champ Rue -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><MapPin class="h-4 w-4"/></InputIcon>
          <InputText
            id="commercial_rue"
            v-model="formData.commercial_rue"
            fluid
          />
        </IconField>
        <label for="commercial_rue" class="text-primary">Rue</label>
      </FloatLabel>
    </div>

    <!-- Champ Code postal -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Map class="h-4 w-4"/></InputIcon>
          <InputText
            id="commercial_cp"
            v-model="formData.commercial_cp"
            :invalid="showCpError"
            fluid
          />
        </IconField>
        <label for="commercial_cp" class="text-primary">Code postal</label>
      </FloatLabel>
    </div>

    <!-- Champ Ville -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Map class="h-4 w-4"/></InputIcon>
          <InputText
            id="commercial_ville"
            v-model="formData.commercial_ville"
            fluid
          />
        </IconField>
        <label for="commercial_ville" class="text-primary">Ville</label>
      </FloatLabel>
    </div>

    <!-- Option pour les informations comptables différentes -->
    <div class="flex items-center gap-2 mt-4">
      <Checkbox
        id="different_accounting"
        v-model="differentAccounting"
        binary
        @change="handleCheckboxChange"
      />
      <label for="different_accounting" class="text-primary">Informations comptables différentes</label>
    </div>

    <div class="flex gap-4 mt-4">
      <Button
        type="button"
        @click="prevStep"
        label="Précédent"
        class="w-1/2 btn-neutral"
        fluid
      >
        <template #icon>
          <ArrowLeft class="h-4 w-4" />
        </template>
      </Button>

      <!-- Afficher le bouton Suivant ou Enregistrer selon que la case est cochée ou non -->
      <Button
        v-if="differentAccounting"
        type="button"
        @click="nextStep"
        label="Suivant"
        class="w-1/2 btn-primary"
        fluid
      >
        <template #icon>
          <ArrowRight class="h-4 w-4" />
        </template>
      </Button>

      <Button
        v-else
        type="button"
        @click="submitForm"
        :label="isSubmitting ? 'Création en cours...' : 'Enregistrer'"
        class="w-1/2 btn-primary"
        :disabled="isSubmitting"
        fluid
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.p-inputtext) {
  width: 100%;
}

:deep([invalid="true"]) {
  border-color: var(--red-500) !important;
}

:deep(.p-checkbox[invalid="true"]) .p-checkbox-box {
  border-color: var(--red-500) !important;
}
</style>
