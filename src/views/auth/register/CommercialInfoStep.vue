<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  }
})

const emit = defineEmits([
  'prev-step',
  'next-step',
  'update:formData',
  'update:different-accounting',
  'submit'
])

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

// État local pour la case à cocher des informations comptables différentes
const differentAccountingInfo = ref(props.differentAccountingInfo)

// État des erreurs
const errors = ref({
  commercial_nom: '',
  commercial_prenom: '',
  commercial_tel: '',
  commercial_cp: ''
})

// Fonction de validation de champ individuel
const validateField = (field) => {
  switch (field) {
    case 'commercial_nom':
      if (!formData.value.commercial_nom) {
        errors.value.commercial_nom = "Le nom est requis"
      } else {
        errors.value.commercial_nom = ''
      }
      break
    case 'commercial_prenom':
      if (!formData.value.commercial_prenom) {
        errors.value.commercial_prenom = "Le prénom est requis"
      } else {
        errors.value.commercial_prenom = ''
      }
      break
    case 'commercial_tel':
      if (!formData.value.commercial_tel) {
        errors.value.commercial_tel = "Le téléphone est requis"
      } else if (!/^(\+33|0)[1-9](\d{2}){4}$/.test(formData.value.commercial_tel.replace(/\s/g, ''))) {
        errors.value.commercial_tel = "Le format du téléphone n'est pas valide"
      } else {
        errors.value.commercial_tel = ''
      }
      break
    case 'commercial_cp':
      if (formData.value.commercial_cp && !/^\d{5}$/.test(formData.value.commercial_cp.replace(/\s/g, ''))) {
        errors.value.commercial_cp = "Le code postal doit contenir 5 chiffres"
      } else {
        errors.value.commercial_cp = ''
      }
      break
  }
}

// Valider tous les champs
const validateForm = () => {
  //validateField('commercial_nom')
  //validateField('commercial_prenom')
  //validateField('commercial_tel')
  //validateField('commercial_cp')

  const isValid = Object.values(errors.value).every(error => error === '')
  return isValid
}

// Fonction pour revenir à l'étape précédente
const prevStep = () => {
  // Mettre à jour les données du formulaire parent avant de revenir
  updateFormData()
  emit('prev-step')
}

// Fonction pour passer à l'étape suivante
const nextStep = () => {
  const isValid = validateForm()

  // Mettre à jour les données du formulaire parent
  updateFormData()

  // Passer à l'étape suivante si le formulaire est valide
  emit('next-step', isValid)
}

// Fonction pour soumettre le formulaire directement (si pas d'étape comptable)
const submitForm = () => {
  const isValid = validateForm()

  // Mettre à jour les données du formulaire parent
  updateFormData()

  // Soumettre si le formulaire est valide
  emit('submit', isValid)
}

// Mettre à jour les données du formulaire parent
const updateFormData = () => {
  emit('update:formData', formData.value, 2)
}

// Mettre à jour l'option des informations comptables différentes
const updateDifferentAccountingInfo = () => {
  emit('update:different-accounting', differentAccountingInfo.value)
}
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-2 text-bleu">
      <Label for="commercial_nom" class="text-bleu">Nom (contact commercial)</Label>
      <Input
          id="commercial_nom"
          v-model="formData.commercial_nom"
          type="text"
          :class="{'border-red-500': errors.commercial_nom}"
      />
      <p v-if="errors.commercial_nom" class="text-red-500 text-xs mt-1">{{ errors.commercial_nom }}</p>
    </div>

    <div class="grid gap-2 text-bleu">
      <Label for="commercial_prenom" class="text-bleu">Prénom (contact commercial)</Label>
      <Input
          id="commercial_prenom"
          v-model="formData.commercial_prenom"
          type="text"
          :class="{'border-red-500': errors.commercial_prenom}"
      />
      <p v-if="errors.commercial_prenom" class="text-red-500 text-xs mt-1">{{ errors.commercial_prenom }}</p>
    </div>

    <div class="grid gap-2 text-bleu">
      <Label for="commercial_fonction" class="text-bleu">Fonction (contact commercial)</Label>
      <Input
          id="commercial_fonction"
          v-model="formData.commercial_fonction"
          type="text"
      />
    </div>

    <div class="grid gap-2 text-bleu">
      <Label for="commercial_tel" class="text-bleu">Téléphone (contact commercial)</Label>
      <Input
          id="commercial_tel"
          v-model="formData.commercial_tel"
          type="tel"
          :class="{'border-red-500': errors.commercial_tel}"
      />
      <p v-if="errors.commercial_tel" class="text-red-500 text-xs mt-1">{{ errors.commercial_tel }}</p>
    </div>

    <div class="grid gap-2 text-bleu">
      <Label for="commercial_rue" class="text-bleu">Rue (contact commercial)</Label>
      <Input
          id="commercial_rue"
          v-model="formData.commercial_rue"
          type="text"
      />
    </div>

    <div class="grid gap-2 text-bleu">
      <Label for="commercial_cp" class="text-bleu">Code postal (contact commercial)</Label>
      <Input
          id="commercial_cp"
          v-model="formData.commercial_cp"
          type="text"
          :class="{'border-red-500': errors.commercial_cp}"
      />
      <p v-if="errors.commercial_cp" class="text-red-500 text-xs mt-1">{{ errors.commercial_cp }}</p>
    </div>

    <div class="grid gap-2 text-bleu">
      <Label for="commercial_ville" class="text-bleu">Ville (contact commercial)</Label>
      <Input
          id="commercial_ville"
          v-model="formData.commercial_ville"
          type="text"
      />
    </div>

    <!-- Option pour les informations comptables différentes -->
    <div class="flex items-center gap-2 mt-4">
      <input
          type="checkbox"
          id="different_accounting"
          v-model="differentAccountingInfo"
          class="w-4 h-4"
          @change="updateDifferentAccountingInfo"
      />
      <Label for="different_accounting" class="text-bleu">Informations comptables différentes</Label>
    </div>

    <div class="flex gap-4">
      <Button
          type="button"
          @click="prevStep"
          class="w-1/2 text-bleu border border-bleu bg-white hover:text-bleu hover:bg-white cursor-pointer"
      >
        Précédent
      </Button>
      <Button
          v-if="differentAccountingInfo"
          type="button"
          @click="nextStep"
          class="w-1/2 text-white bg-bleu cursor-pointer"
      >
        Suivant
      </Button>
      <Button
          v-else
          type="button"
          @click="submitForm"
          class="w-1/2 text-white bg-bleu cursor-pointer"
          :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Création en cours...' : 'Enregistrer' }}
      </Button>
    </div>
  </div>
</template>
