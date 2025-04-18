<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import axios from 'axios'

import StepIndicator from '@/views/auth/register/StepIndicator.vue'
import GeneralInfoStep from '@/views/auth/register/GeneralInfoStep.vue'
import CommercialInfoStep from '@/views/auth/register/CommercialInfoStep.vue'
import AccountingInfoStep from '@/views/auth/register/AccountingInfoStep.vue'

const router = useRouter()

// État pour suivre l'étape actuelle du formulaire
const currentStep = ref(1)
const differentAccountingInfo = ref(false)
const isSubmitting = ref(false)

// État pour stocker les valeurs du formulaire
const formData = ref({
  email: '',
  password: '',
  user_raison_sociale: '',
  user_siret: '',
  user_connaissance: [],
  user_connaissance_autre: '',
  user_offre: [],
  commercial_nom: '',
  commercial_prenom: '',
  commercial_fonction: '',
  commercial_tel: '',
  commercial_rue: '',
  commercial_cp: '',
  commercial_ville: '',
  comptable_nom: '',
  comptable_prenom: '',
  comptable_fonction: '',
  comptable_email: '',
  comptable_tel: '',
  comptable_rue: '',
  comptable_cp: '',
  comptable_ville: ''
})

// Fonction pour passer à l'étape suivante avec validation
const nextStep = (isValid) => {
  if (isValid && currentStep.value < 3) {
    currentStep.value++
  }
}

// Fonction pour revenir à l'étape précédente
const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Mettre à jour le statut des informations comptables différentes
const updateDifferentAccountingInfo = (value) => {
  differentAccountingInfo.value = value
}

// Mettre à jour les données du formulaire depuis les étapes enfants
const updateFormData = (stepData, step) => {
  formData.value = { ...formData.value, ...stepData }
}

// Préparer les données API
const prepareApiData = () => {
  const apiData = {
    name: formData.value.email,
    email: formData.value.email,
    pass: formData.value.password
  }

  // Ajouter tous les champs avec le préfixe field_
  for (const [key, value] of Object.entries(formData.value)) {
    if (key !== 'email' && key !== 'password') {
      // Ne pas inclure user_connaissance_autre si l'option 'autre' n'est pas sélectionnée
      if (key === 'user_connaissance_autre' && !formData.value.user_connaissance.includes('autre')) {
        continue
      }
      // Pour user_connaissance, filtrer la valeur "autre" si elle existe
      if (key === 'user_connaissance') {
        apiData[`field_${key}`] = value.filter(item => item !== 'autre')
      } else {
        apiData[`field_${key}`] = value
      }
    }
  }

  return apiData
}

// Fonction pour soumettre le formulaire
const submitForm = async (isValid) => {
  if (!isValid) return

  isSubmitting.value = true

  try {
    const apiData = prepareApiData()
    const response = await axios({
      method: 'post',
      url: 'https://api.tco/api/user',
      headers: {
        'Content-Type': 'application/vnd.api+json'
      },
      data: JSON.stringify(apiData)
    })

    console.log('User registered successfully:', response.data)

    // Rediriger vers la page de connexion avec un message de succès
    router.push('/login')

    // Afficher un message de succès avec sonner
    toast('Compte créé avec succès', {
      description: 'Votre compte doit maintenant être validé par un administrateur. Vous recevrez un email lorsque votre compte sera activé.',
      duration: 6000,
      position: 'top-center'
    })

  } catch (error) {
    console.error('Registration error:', error)

    // Gérer les différents codes d'erreur de l'API
    if (error.response) {
      const status = error.response.status
      const errorData = error.response.data

      switch(status) {
        case 400:
          // Erreur de validation ou données manquantes
          if (errorData.error && Array.isArray(errorData.error)) {
            // Afficher la liste des erreurs de validation
            toast.error('Erreur lors de l\'inscription', {
              description: errorData.error.join(', '),
              duration: 5000
            })
          } else if (errorData.error && typeof errorData.error === 'string') {
            // Message d'erreur simple
            toast.error('Erreur lors de l\'inscription', {
              description: errorData.error,
              duration: 5000
            })
          } else {
            toast.error('Erreur lors de l\'inscription', {
              description: 'Veuillez vérifier les informations saisies',
              duration: 5000
            })
          }
          break

        case 409:
          // Conflit - email déjà utilisé
          toast.error('Inscription impossible', {
            description: 'Cette adresse email est déjà utilisée',
            duration: 5000
          })
          break

        case 500:
        default:
          // Erreur serveur ou autre erreur
          toast.error('Erreur lors de l\'inscription', {
            description: 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer plus tard.',
            duration: 5000
          })
      }
    } else {
      // Erreur réseau ou autre
      toast.error('Erreur de connexion', {
        description: 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.',
        duration: 5000
      })
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form class="flex flex-col gap-6">
    <!-- En-tête du formulaire -->
    <div class="flex flex-col items-center gap-2 text-center">
      <h1 class="text-2xl font-bold text-bleu">
        Créer votre compte
      </h1>
      <p class="text-balance text-sm text-bleu" v-if="currentStep === 1">
        Renseignez vos informations générales
      </p>
      <p class="text-balance text-sm text-bleu" v-if="currentStep === 2">
        Renseignez vos informations commerciales
      </p>
      <p class="text-balance text-sm text-bleu" v-if="currentStep === 3">
        Renseignez vos informations comptables
      </p>
    </div>

    <!-- Indicateur d'étape -->
    <StepIndicator
        :current-step="currentStep"
        :has-accounting-step="differentAccountingInfo"
    />

    <!-- Étape 1: Informations générales -->
    <GeneralInfoStep
        v-if="currentStep === 1"
        :initial-data="formData"
        @next-step="nextStep"
        @update:form-data="updateFormData"
    />

    <!-- Étape 2: Informations commerciales -->
    <CommercialInfoStep
        v-if="currentStep === 2"
        :initial-data="formData"
        :is-submitting="isSubmitting"
        :different-accounting-info="differentAccountingInfo"
        @prev-step="prevStep"
        @next-step="nextStep"
        @update:form-data="updateFormData"
        @update:different-accounting="updateDifferentAccountingInfo"
        @submit="submitForm"
    />

    <!-- Étape 3: Informations comptables -->
    <AccountingInfoStep
        v-if="currentStep === 3 && differentAccountingInfo"
        :initial-data="formData"
        :is-submitting="isSubmitting"
        @prev-step="prevStep"
        @update:form-data="updateFormData"
        @submit="submitForm"
    />

    <!-- Lien vers la page de connexion -->
    <div class="text-center text-sm text-bleu">
      Vous avez déjà un compte ?
      <div class="underline underline-offset-4 text-bleu">
        <RouterLink to="/login">
          Connectez-vous
        </RouterLink>
      </div>
    </div>
  </form>
</template>
