<script setup>
import {computed, ref} from 'vue'
import {useToast} from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import FloatLabel from 'primevue/floatlabel'
import {ArrowLeft, ArrowRight, Building, Mail, Map, Phone, User} from 'lucide-vue-next'

const props = defineProps({
  initialData: {
    type: Object,
    required: true
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  activateCallback: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['update:formData', 'submit'])
const toast = useToast()

// Variable pour suivre si le formulaire a été soumis
const isSubmitted = ref(false)

// Copie locale des données pour cette étape
const formData = ref({
  comptable_nom: props.initialData.comptable_nom || '',
  comptable_prenom: props.initialData.comptable_prenom || '',
  comptable_fonction: props.initialData.comptable_fonction || '',
  comptable_email: props.initialData.comptable_email || '',
  comptable_tel: props.initialData.comptable_tel || '',
  comptable_rue: props.initialData.comptable_rue || '',
  comptable_cp: props.initialData.comptable_cp || '',
  comptable_ville: props.initialData.comptable_ville || ''
})

// Validation des champs
const isNomValid = computed(() => {
  return formData.value.comptable_nom !== ''
})

const isPrenomValid = computed(() => {
  return formData.value.comptable_prenom !== ''
})

const isEmailValid = computed(() => {
  return formData.value.comptable_email !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.comptable_email)
})

const isTelValid = computed(() => {
  // Simplifier la validation puisque nous garantissons déjà que seuls les chiffres sont saisis
  return formData.value.comptable_tel !== '' && formData.value.comptable_tel.length === 10
})

const isCodePostalValid = computed(() => {
  if (!formData.value.comptable_cp) return true // Optionnel s'il est vide
  const cpWithoutSpaces = formData.value.comptable_cp.replace(/\s/g, '')
  return /^\d{5}$/.test(cpWithoutSpaces)
})

// Computed properties pour l'affichage conditionnel des erreurs
const showNomError = computed(() => isSubmitted.value && !isNomValid.value)
const showPrenomError = computed(() => isSubmitted.value && !isPrenomValid.value)
const showEmailError = computed(() => isSubmitted.value && !isEmailValid.value)
const showTelError = computed(() => isSubmitted.value && !isTelValid.value)
const showCpError = computed(() => isSubmitted.value && !isCodePostalValid.value)

// Valider tous les champs
const validateForm = () => {
  isSubmitted.value = true
  let isValid = true
  let errorMessage = ''

  if (!isNomValid.value) {
    isValid = false
    errorMessage = "Le nom est requis"
  } else if (!isPrenomValid.value) {
    isValid = false
    errorMessage = "Le prénom est requis"
  } else if (!isEmailValid.value) {
    isValid = false
    if (!formData.value.comptable_email) {
      errorMessage = "L'email est requis"
    } else {
      errorMessage = "L'email n'est pas valide"
    }
  } else if (!isTelValid.value) {
    isValid = false
    if (!formData.value.comptable_tel) {
      errorMessage = "Le téléphone est requis"
    } else {
      errorMessage = "Le format du téléphone n'est pas valide (ex: 0123456789)"
    }
  } else if (!isCodePostalValid.value) {
    isValid = false
    errorMessage = "Le code postal doit contenir exactement 5 chiffres"
  }

  if (!isValid && errorMessage) {
    toast.add({
      severity: 'error',
      summary: 'Erreur de validation',
      detail: errorMessage,
      life: 5000
    })
  }

  return isValid
}

// Fonction pour revenir à l'étape précédente
const prevStep = () => {
  // Mettre à jour les données du formulaire parent avant de revenir
  updateFormData()
  props.activateCallback('2')
}

// Fonction pour soumettre le formulaire
const submitForm = () => {
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
  emit('update:formData', formData.value, 3)
}
</script>

<template>
  <div class="grid gap-3">
    <!-- Champ Nom -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><User class="h-4 w-4"/></InputIcon>
          <InputText
            id="comptable_nom"
            v-model="formData.comptable_nom"
            :invalid="showNomError"
            required
            fluid
          />
        </IconField>
        <label for="comptable_nom" class="text-primary">Nom</label>
      </FloatLabel>
    </div>

    <!-- Champ Prénom -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><User class="h-4 w-4"/></InputIcon>
          <InputText
            id="comptable_prenom"
            v-model="formData.comptable_prenom"
            :invalid="showPrenomError"
            required
            fluid
          />
        </IconField>
        <label for="comptable_prenom" class="text-primary">Prénom</label>
      </FloatLabel>
    </div>

    <!-- Champ Fonction -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Building class="h-4 w-4"/></InputIcon>
          <InputText
            id="comptable_fonction"
            v-model="formData.comptable_fonction"
            fluid
          />
        </IconField>
        <label for="comptable_fonction" class="text-primary">Fonction</label>
      </FloatLabel>
    </div>

    <!-- Champ Email -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Mail class="h-4 w-4"/></InputIcon>
          <InputText
            id="comptable_email"
            v-model="formData.comptable_email"
            type="email"
            :invalid="showEmailError"
            required
            fluid
          />
        </IconField>
        <label for="comptable_email" class="text-primary">Email</label>
      </FloatLabel>
    </div>

    <!-- Champ Téléphone -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Phone class="h-4 w-4"/></InputIcon>
          <InputText
            id="comptable_tel"
            v-model="formData.comptable_tel"
            :invalid="showTelError"
            maxlength="10"
            required
            fluid
          />
        </IconField>
        <label for="comptable_tel" class="text-primary">Téléphone</label>
      </FloatLabel>
    </div>

    <!-- Champ Rue -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Map class="h-4 w-4"/></InputIcon>
          <InputText
            id="comptable_rue"
            v-model="formData.comptable_rue"
            fluid
          />
        </IconField>
        <label for="comptable_rue" class="text-primary">Rue</label>
      </FloatLabel>
    </div>

    <!-- Champ Code postal -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Map class="h-4 w-4"/></InputIcon>
          <InputText
            id="comptable_cp"
            v-model="formData.comptable_cp"
            :invalid="showCpError"
            fluid
          />
        </IconField>
        <label for="comptable_cp" class="text-primary">Code postal</label>
      </FloatLabel>
    </div>

    <!-- Champ Ville -->
    <div class="grid gap-2">
      <FloatLabel variant="on">
        <IconField>
          <InputIcon><Building class="h-4 w-4"/></InputIcon>
          <InputText
            id="comptable_ville"
            v-model="formData.comptable_ville"
            fluid
          />
        </IconField>
        <label for="comptable_ville" class="text-primary">Ville</label>
      </FloatLabel>
    </div>

    <!-- Boutons d'action -->
    <div class="flex gap-4 mt-3">
      <Button
        type="button"
        @click="prevStep"
        label="Précédent"
        class="w-1/2"
        outlined
        fluid
      >
        <template #icon>
          <ArrowLeft class="h-4 w-4" />
        </template>
      </Button>
      <Button
        type="button"
        @click="submitForm"
        :label="isSubmitting ? 'Création en cours...' : 'Enregistrer'"
        class="w-1/2"
        :loading="isSubmitting"
        :disabled="isSubmitting"
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
