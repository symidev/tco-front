<script setup>
import {computed, ref, watch} from 'vue'
import {Building, Mail, Hash, Percent, Upload, X} from 'lucide-vue-next'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import FloatLabel from 'primevue/floatlabel'
import Button from 'primevue/button'
import Image from 'primevue/image'

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

// Logo file handling
const fileInput = ref(null)
const previewUrl = ref(null)

// Fonction pour ouvrir le sélecteur de fichier
const openFileDialog = () => {
  fileInput.value?.click()
}

// Fonction pour gérer la sélection de fichier
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return
    }
    
    // Créer une URL de prévisualisation
    previewUrl.value = URL.createObjectURL(file)
    
    // Mettre à jour le formData
    props.formData.user_logo = file
  }
}

// Fonction pour supprimer le logo
const removeLogo = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  props.formData.user_logo = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Computed pour l'URL de prévisualisation
const logoPreviewUrl = computed(() => {
  // Priorité à la prévisualisation locale (nouveau fichier sélectionné)
  if (previewUrl.value) {
    return previewUrl.value
  }
  // Sinon, afficher le logo existant (URL string)
  if (props.formData.user_logo && typeof props.formData.user_logo === 'string') {
    return props.formData.user_logo
  }
  return null
})

// Initialisation et surveillance du logo existant
watch(() => props.formData.user_logo, (newLogo, oldLogo) => {
  // Si c'est une nouvelle URL (pas un File), reset la prévisualisation locale
  if (newLogo && typeof newLogo === 'string' && newLogo !== oldLogo) {
    // Reset la prévisualisation locale pour afficher le logo du serveur
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
  }
}, { immediate: true })

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

        <!-- Logo de l'entreprise (prend toute la largeur) -->
        <div class="grid gap-2 col-span-1 md:col-span-2">
          <label class="text-primary font-medium">Logo de l'entreprise</label>
          
          <!-- Input file caché -->
          <input 
            ref="fileInput"
            type="file" 
            accept="image/*" 
            @change="handleFileSelect"
            class="hidden"
          />
          
          <!-- Zone logo compacte -->
          <div class="logo-section">
            <!-- Logo existant -->
            <div v-if="logoPreviewUrl" class="logo-preview">
              <div class="logo-thumbnail">
                <img 
                  :src="logoPreviewUrl" 
                  alt="Logo de l'entreprise"
                  class="logo-img"
                />
              </div>
              <div class="logo-info">
                <div class="logo-actions-inline">
                  <Button 
                    type="button"
                    text
                    size="small"
                    @click="openFileDialog"
                    class="text-primary"
                  >
                    <Upload class="h-3 w-3 mr-1"/>
                    Changer
                  </Button>
                  <span class="text-gray-400">|</span>
                  <Button 
                    type="button"
                    text
                    size="small"
                    @click="removeLogo"
                    class="text-red-500"
                  >
                    <X class="h-3 w-3 mr-1"/>
                    Supprimer
                  </Button>
                </div>
                <small class="format-hint">JPG, PNG, GIF</small>
              </div>
            </div>
            
            <!-- Upload zone compacte -->
            <div v-else class="upload-compact" @click="openFileDialog">
              <Upload class="upload-icon-small"/>
              <span class="upload-text-inline">Télécharger un logo</span>
              <small class="format-hint">JPG, PNG, GIF</small>
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

/* Styles pour le logo compact */
.logo-section {
  border: 1px solid var(--p-content-border-color, #dee2e6);
  border-radius: 0.375rem;
  padding: 0.75rem;
  background-color: var(--p-content-background, white);
}

.logo-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-thumbnail {
  width: 60px;
  height: 60px;
  border: 1px solid var(--p-content-border-color, #dee2e6);
  border-radius: 0.375rem;
  overflow: hidden;
  background-color: white;
  flex-shrink: 0;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.25rem;
}

.logo-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.logo-actions-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upload-compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.upload-compact:hover {
  background-color: var(--p-content-background, #0f172a);
}

.upload-icon-small {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--p-primary-color, #0ea5e9);
  flex-shrink: 0;
}

.upload-text-inline {
  color: var(--p-primary-color, #0ea5e9);
  font-weight: 500;
  cursor: pointer;
}

.format-hint {
  color: var(--p-text-muted-color, #6b7280);
  font-size: 0.75rem;
}

/* Responsive */
@media (max-width: 640px) {
  .logo-preview {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .logo-actions-inline {
    flex-wrap: wrap;
  }
  
  .upload-compact {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
