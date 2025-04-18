<script setup>
import { ref } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    required: true
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['prev-step', 'update:formData', 'submit'])

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

// État des erreurs
const errors = ref({
  comptable_nom: '',
  comptable_prenom: '',
  comptable_email: '',
  comptable_tel: '',
  comptable_cp: ''
})

// Fonction de validation de champ individuel
const validateField = (field) => {
  switch (field) {
    case 'comptable_nom':
      if (!formData.value.comptable_nom) {
        errors.value.comptable_nom = "Le nom est requis"
      } else {
        errors.value.comptable_nom = ''
      }
      break
    case 'comptable_prenom':
      if (!formData.value.comptable_prenom) {
        errors.value.comptable_prenom = "Le prénom est requis"
      } else {
        errors.value.comptable_prenom = ''
      }
      break
    case 'comptable_email':
      if (!formData.value.comptable_email) {
        errors.value.comptable_email = "L'email est requis"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.comptable_email)) {
        errors.value.comptable_email = "L'email n'est pas valide"
      } else {
        errors.value.comptable_email = ''
      }
      break
    case 'comptable_tel':
      if (!formData.value.comptable_tel) {
        errors.value.comptable_tel = "Le téléphone est requis"
      } else if (!/^(\+33|0)[1-9](\d{2}){4}$/.test(formData.value.comptable_tel.replace(/\s/g, ''))) {
        errors.value.comptable_tel = "Le format du téléphone n'est pas valide"
      } else {
        errors.value.comptable_tel = ''
      }
      break
    case 'comptable_cp':
      if (formData.value.comptable_cp && !/^\d{5}$/.test(formData.value.comptable_cp.replace(/\s/g, ''))) {
        errors.value.comptable_cp = "Le code postal doit contenir 5 chiffres"
      } else {
        errors.value.comptable_cp = ''
      }
      break
  }
}

// Valider tous les champs
const validateForm = () => {
  //validateField('comptable_nom')
 // validateField('comptable_prenom')
  //validateField('comptable_email')
  //validateField('comptable_tel')
  //validateField('comptable_cp')

  const isValid = Object.values(errors.value).every(error => error === '')
  return isValid
}

// Fonction pour revenir à l'étape précédente
const prevStep = () => {
  // Mettre à jour les données du formulaire parent avant de revenir
  updateFormData()
  emit('prev-step')
}

// Fonction pour soumettre le formulaire
const submitForm = () => {
  const isValid = validateForm()

  // Mettre à jour les données du formulaire parent
  updateFormData()

  // Soumettre si le formulaire est valide
  emit('submit', isValid)
}

// Mettre à jour les données du formulaire parent
const updateFormData = () => {
  emit('update:formData', formData.value, 3)
}
</script>

<template>
  <div class="grid gap-1">
    <h2 class="text-xl font-bold mb-4">Informations comptable</h2>
    <div class="grid gap-1">
      <input
          id="comptable_nom"
          v-model="formData.comptable_nom"
          type="text"
          placeholder="Nom"
          class="input" :class="{'border-error': errors.comptable_nom}"
      />
      <p v-if="errors.comptable_nom" class="text-error text-xs mt-1">{{ errors.comptable_nom }}</p>
    </div>

    <div class="grid gap-1">
      <input
          id="comptable_prenom"
          v-model="formData.comptable_prenom"
          type="text"
          placeholder="Prénom"
          class="input"
          :class="{'border-error': errors.comptable_prenom}"
      />
      <p v-if="errors.comptable_prenom" class="text-error text-xs mt-1">{{ errors.comptable_prenom }}</p>
    </div>

    <div class="grid gap-1">
      <input
          id="comptable_fonction"
          v-model="formData.comptable_fonction"
          type="text"
          placeholder="Fonction"
          class="input"
      />
    </div>

    <div class="grid gap-1">
      <input
          id="comptable_email"
          v-model="formData.comptable_email"
          type="email"
          placeholder="Email"
          class="input"
          :class="{'border-error': errors.comptable_email}"
      />
      <p v-if="errors.comptable_email" class="text-error text-xs mt-1">{{ errors.comptable_email }}</p>
    </div>

    <div class="grid gap-1">
      <input
          id="comptable_tel"
          v-model="formData.comptable_tel"
          type="tel"
          placeholder="Téléphone"
          class="input"
          :class="{'border-error': errors.comptable_tel}"
      />
      <p v-if="errors.comptable_tel" class="text-error text-xs mt-1">{{ errors.comptable_tel }}</p>
    </div>

    <div class="grid gap-1">
      <input
          id="comptable_rue"
          v-model="formData.comptable_rue"
          type="text"
          placeholder="Rue"
          class="input"
      />
    </div>

    <div class="grid gap-1">
      <input
          id="comptable_cp"
          v-model="formData.comptable_cp"
          type="text"
          placeholder="Code postal"
          class="input"
          :class="{'border-error': errors.comptable_cp}"
      />
      <p v-if="errors.comptable_cp" class="text-error text-xs mt-1">{{ errors.comptable_cp }}</p>
    </div>

    <div class="grid gap-1">
      <input
          id="comptable_ville"
          v-model="formData.comptable_ville"
          type="text"
          placeholder="Ville"
          class="input"
      />
    </div>

    <div class="flex gap-4 mt-4">
      <button
          type="button"
          @click="prevStep"
          class="w-1/2 btn btn-neutral"
      >
        Précédent
      </Button>
      <button
          type="button"
          @click="submitForm"
          class="w-1/2 btn btn-primary"
          :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Création en cours...' : 'Enregistrer' }}
      </Button>
    </div>
  </div>
</template>
