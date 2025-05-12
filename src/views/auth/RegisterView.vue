<script setup>
import {ref, computed} from 'vue'
import {useRouter} from 'vue-router'
import {useToast} from 'primevue/usetoast'
import axios from 'axios'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Stepper from 'primevue/stepper';
import StepList from 'primevue/steplist';
import StepPanels from 'primevue/steppanels';
import StepItem from 'primevue/stepitem';
import Step from 'primevue/step';
import StepPanel from 'primevue/steppanel';

import GeneralInfoStep from '@/views/auth/register/GeneralInfoStep.vue'
import CommercialInfoStep from '@/views/auth/register/CommercialInfoStep.vue'
import AccountingInfoStep from '@/views/auth/register/AccountingInfoStep.vue'

const router = useRouter()
const toast = useToast()

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
  if (isValid) {
    if (currentStep.value === 2 && !differentAccountingInfo.value) {
      return
    }

    if (currentStep.value < 3) {
      currentStep.value++
    }
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
  // Assurez-vous que la valeur est un booléen
  differentAccountingInfo.value = Boolean(value)
}

// Mettre à jour les données du formulaire depuis les étapes enfants
const updateFormData = (stepData, step) => {
  formData.value = {...formData.value, ...stepData}
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
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    const apiData = prepareApiData()
    const response = await axios({
      method: 'post',
      url: API_URL + '/api/user',
      headers: {
        'Content-Type': 'application/vnd.api+json'
      },
      data: JSON.stringify(apiData)
    })

    // Rediriger vers la page de connexion avec un message de succès
    router.push('/login')

    // Afficher un message de succès avec PrimeVue
    toast.add({
      severity: 'success',
      summary: 'Compte créé avec succès',
      detail: 'Votre compte doit maintenant être validé par un administrateur. Vous recevrez un email lorsque votre compte sera activé.',
      life: 10000
    })

  } catch (error) {
    console.error('Registration error:', error)

    // Gérer les différents codes d'erreur de l'API
    if (error.response) {
      const status = error.response.status
      const errorData = error.response.data

      switch (status) {
        case 400:
          // Erreur de validation ou données manquantes
          if (errorData.error && Array.isArray(errorData.error)) {
            // Afficher la liste des erreurs de validation
            toast.add({
              severity: 'error',
              summary: 'Erreur lors de l\'inscription',
              detail: errorData.error.join(', '),
              life: 5000
            })
          } else if (errorData.error && typeof errorData.error === 'string') {
            // Message d'erreur simple
            toast.add({
              severity: 'error',
              summary: 'Erreur lors de l\'inscription',
              detail: errorData.error,
              life: 5000
            })
          } else {
            toast.add({
              severity: 'error',
              summary: 'Erreur lors de l\'inscription',
              detail: 'Veuillez vérifier les informations saisies',
              life: 5000
            })
          }
          break

        case 409:
          // Conflit - email déjà utilisé
          toast.add({
            severity: 'error',
            summary: 'Inscription impossible',
            detail: 'Cette adresse email est déjà utilisée',
            life: 5000
          })
          break

        case 500:
        default:
          // Erreur serveur ou autre erreur
          toast.add({
            severity: 'error',
            summary: 'Erreur lors de l\'inscription',
            detail: 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer plus tard.',
            life: 5000
          })
      }
    } else {
      // Erreur réseau ou autre
      toast.add({
        severity: 'error',
        summary: 'Erreur de connexion',
        detail: 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.',
        life: 5000
      })
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Card class="register-card">
    <template #content>
      <form class="flex flex-col">
        <!-- En-tête du formulaire -->
        <div class="flex flex-col items-center gap-2 text-center">
          <h1 class="text-xl font-bold">
            Créer votre compte
          </h1>
          <p class="text-balance text-sm" v-if="currentStep === 1">
            Renseignez vos informations générales
          </p>
          <p class="text-balance text-sm" v-if="currentStep === 2">
            Renseignez vos informations commerciales
          </p>
          <p class="text-balance text-sm" v-if="currentStep === 3">
            Renseignez vos informations comptables
          </p>
        </div>

        <!-- Indicateur d'étape -->
        <Stepper value="1" linear>
          <StepList>
            <Step value="1">Général</Step>
            <Step value="2">Commercial</Step>
            <Step value="3" v-if="differentAccountingInfo">Comptable</Step>
          </StepList>
          <StepPanels>
            <StepPanel v-slot="{ activateCallback }" value="1">
              <GeneralInfoStep
                  :initial-data="formData"
                  @update:form-data="updateFormData"
                  :activateCallback="activateCallback"
              />
            </StepPanel>
            <StepPanel v-slot="{ activateCallback }" value="2">
              <CommercialInfoStep
                  :initial-data="formData"
                  :is-submitting="isSubmitting"
                  :different-accounting-info="differentAccountingInfo"
                  @update:form-data="updateFormData"
                  @update:different-accounting="updateDifferentAccountingInfo"
                  @submit="submitForm"
                  :activateCallback="activateCallback"

              />
            </StepPanel>
            <StepPanel v-slot="{ activateCallback }" value="3" v-if="differentAccountingInfo">
              <AccountingInfoStep
                  :initial-data="formData"
                  :is-submitting="isSubmitting"
                  @update:form-data="updateFormData"
                  @submit="submitForm"
                  :activateCallback="activateCallback"

              />
            </StepPanel>
          </StepPanels>
        </Stepper>
        <Divider />

        <!-- Lien vers la page de connexion -->
        <div class="text-center">
          Vous avez déjà un compte ?
          <div>
            <RouterLink to="/login" class="animate">
              Connectez-vous
            </RouterLink>
          </div>
        </div>
      </form>
    </template>
  </Card>
</template>

<style scoped>
:deep([invalid="true"]),
:deep(.p-invalid) {
  border-color: var(--red-500) !important;
}
</style>

