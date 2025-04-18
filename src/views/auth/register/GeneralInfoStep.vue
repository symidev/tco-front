<script setup>
import { ref, computed, watchEffect } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  initialData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['next-step', 'update:formData'])

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

// État des erreurs
const errors = ref({
  email: '',
  password: '',
  user_raison_sociale: '',
  user_siret: '',
  user_connaissance: '',
  user_offre: ''
})

// Options pour les intérêts
const interetOptions = [
  {value: 'comparo', label: 'Comparo'},
  {value: 'comparo_multi', label: 'Comparo multi'},
  {value: 'premium', label: 'Premium'},
  {value: 'nsp', label: 'Je ne sais pas'}
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

// Fonction pour gérer la sélection des intérêts
const toggleInteret = (value) => {
  const index = formData.value.user_offre.indexOf(value)
  if (index === -1) {
    formData.value.user_offre.push(value)
  } else {
    formData.value.user_offre.splice(index, 1)
  }
  //validateField('user_offre')
}

// Fonction pour gérer la sélection des canaux de connaissance
const toggleConnaissance = (value) => {
  const index = formData.value.user_connaissance.indexOf(value)
  if (index === -1) {
    formData.value.user_connaissance.push(value)
  } else {
    formData.value.user_connaissance.splice(index, 1)
  }
  //validateField('user_connaissance')
}

// Fonction de validation de champ individuel
const validateField = (field) => {
  switch (field) {
    case 'email':
      if (!formData.value.email) {
        errors.value.email = "L'email est requis"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
        errors.value.email = "L'email n'est pas valide"
      } else {
        errors.value.email = ''
      }
      break
    case 'password':
      if (!formData.value.password) {
        errors.value.password = "Le mot de passe est requis"
      } else if (formData.value.password.length < 8) {
        errors.value.password = "Le mot de passe doit contenir au moins 8 caractères"
      } else if (!/[a-z]/.test(formData.value.password)) {
        errors.value.password = "Le mot de passe doit contenir au moins une lettre minuscule"
      } else if (!/[A-Z]/.test(formData.value.password)) {
        errors.value.password = "Le mot de passe doit contenir au moins une lettre majuscule"
      } else if (!/[0-9]/.test(formData.value.password)) {
        errors.value.password = "Le mot de passe doit contenir au moins un chiffre"
      } else if (!/[^a-zA-Z0-9]/.test(formData.value.password)) {
        errors.value.password = "Le mot de passe doit contenir au moins un caractère spécial"
      } else {
        errors.value.password = ''
      }
      break
    case 'user_raison_sociale':
      if (!formData.value.user_raison_sociale) {
        errors.value.user_raison_sociale = "La raison sociale est requise"
      } else {
        errors.value.user_raison_sociale = ''
      }
      break
    case 'user_siret':
      if (!formData.value.user_siret) {
        errors.value.user_siret = "Le SIRET est requis"
      } else if (!/^\d{14}$/.test(formData.value.user_siret.replace(/\s/g, ''))) {
        errors.value.user_siret = "Le SIRET doit contenir 14 chiffres"
      } else {
        errors.value.user_siret = ''
      }
      break
    case 'user_connaissance':
      if (formData.value.user_connaissance.length === 0) {
        errors.value.user_connaissance = "Veuillez sélectionner au moins un canal de connaissance"
      } else if (formData.value.user_connaissance.includes('autre') && !formData.value.user_connaissance_autre) {
        errors.value.user_connaissance = "Veuillez préciser le canal de connaissance 'Autre'"
      } else {
        errors.value.user_connaissance = ''
      }
      break
    case 'user_offre':
      if (formData.value.user_offre.length === 0) {
        errors.value.user_offre = "Veuillez sélectionner au moins un intérêt"
      } else {
        errors.value.user_offre = ''
      }
      break
  }
}

// Valider tous les champs
const validateForm = () => {
  validateField('email')
  validateField('password')
  //validateField('user_raison_sociale')
  //validateField('user_siret')
  //validateField('user_connaissance')
  //validateField('user_offre')

  const isValid = Object.values(errors.value).every(error => error === '')
  return isValid
}

// Émettre l'événement pour passer à l'étape suivante
const nextStep = () => {
  const isValid = validateForm()

  // Mettre à jour les données du formulaire parent
  emit('update:formData', formData.value, 1)

  // Passer à l'étape suivante si le formulaire est valide
  emit('next-step', isValid)
}
</script>

<template>
  <div class="grid gap-3">
    <div class="grid gap-1">
      <input
          id="email"
          v-model="formData.email"
          type="email"
          placeholder="Email *"
          class="input"
          :class="{'border-error': errors.email}"
          @blur="validateField('email')"
      />
      <p v-if="errors.email" class="text-error text-xs mt-1">{{ errors.email }}</p>
    </div>

    <div class="grid gap-1">
      <input
          id="password"
          v-model="formData.password"
          type="password"
          placeholder="Mot de passe *"
          class="input"
          :class="{'border-error': errors.password}"
          @blur="validateField('password')"
      />
      <p v-if="errors.password" class="text-error text-xs mt-1">{{ errors.password }}</p>
    </div>

    <div class="grid gap-1">
      <input
          id="raison_sociale"
          v-model="formData.user_raison_sociale"
          type="text"
          placeholder="Raison sociale"
          class="input"
          :class="{'border-error': errors.user_raison_sociale}"
      />
      <p v-if="errors.user_raison_sociale" class="text-error text-xs mt-1">{{ errors.user_raison_sociale }}</p>
    </div>

    <div class="grid gap-1">
      <input
          id="siret"
          v-model="formData.user_siret"
          type="text"
          placeholder="Siret"
          class="input"
          :class="{'border-error': errors.user_siret}"
      />
      <p v-if="errors.user_siret" class="text-error text-xs mt-1">{{ errors.user_siret }}</p>
    </div>

    <div class="grid gap-1">
      <label class="text-primary">Canal de connaissance</Label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6">
        <!-- Options normales (sauf "autre") -->
        <div
            v-for="option in connaissanceOptions.filter(opt => opt.value !== 'autre')"
            :key="option.value"
            class="flex items-center"
        >
          <div class="flex items-center gap-2">
            <input
                type="checkbox"
                :id="`connaissance-${option.value}`"
                :value="option.value"
                :checked="formData.user_connaissance.includes(option.value)"
                @change="toggleConnaissance(option.value)"
                class="w-4 h-4 flex-shrink-0"
            />
            <label :for="`connaissance-${option.value}`" class="text-sm">{{ option.label }}</Label>
          </div>
        </div>

        <!-- Option "autre" sur toute la largeur -->
        <div
            v-if="connaissanceOptions.some(opt => opt.value === 'autre')"
            class="flex items-center col-span-1 sm:col-span-2"
        >
          <div class="flex items-center gap-1">
            <input
                type="checkbox"
                id="connaissance-autre"
                value="autre"
                :checked="formData.user_connaissance.includes('autre')"
                @change="toggleConnaissance('autre')"
                class="w-4 h-6 flex-shrink-0"
            />
            <label for="connaissance-autre" class="text-sm">
              {{ connaissanceOptions.find(opt => opt.value === 'autre')?.label || 'Autre' }}
            </Label>
          </div>

          <input
              v-if="isOtherKnowledgeSelected"
              v-model="formData.user_connaissance_autre"
              type="text"
              class="h-6 ml-2 flex-grow input"
              placeholder="Précisez..."
              @blur="validateField('user_connaissance')"
          />
        </div>
        <p v-if="errors.user_connaissance" class="text-error text-xs mt-1 col-span-1 sm:col-span-2">
          {{ errors.user_connaissance }}
        </p>
      </div>
    </div>

    <div class="grid gap-1">
      <label class="text-primary">Intérêt offre</Label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6">
        <div v-for="option in interetOptions" :key="option.value" class="flex items-center gap-2">
          <input
              type="checkbox"
              :id="`interet-${option.value}`"
              :value="option.value"
              :checked="formData.user_offre.includes(option.value)"
              @change="toggleInteret(option.value)"
              class="w-4 h-4 flex-shrink-0"
          />
          <label :for="`interet-${option.value}`" class="text-sm">{{ option.label }}</Label>
        </div>
        <p v-if="errors.user_offre" class="text-error text-xs mt-1 col-span-1 sm:col-span-2">
          {{ errors.user_offre }}
        </p>
      </div>
    </div>

    <div class="text-right">
      <button type="button" @click="nextStep" class="w-1/2 btn btn-primary">
        Suivant
      </Button>
    </div>
  </div>
</template>
