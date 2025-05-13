<script setup>
import { UserCircle, User, Phone, MapPin, Briefcase } from 'lucide-vue-next'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import FloatLabel from 'primevue/floatlabel'
import { computed } from 'vue'

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

// Validation du téléphone
const isTelValid = computed(() => {
  return !props.formData.commercial_tel || (props.formData.commercial_tel.length === 10 && /^\d{10}$/.test(props.formData.commercial_tel))
})

// Computed pour l'affichage des erreurs
const showTelError = computed(() => props.validationActive && !isTelValid.value)

// Fonction pour normaliser la saisie du téléphone (seulement des chiffres)
const handleTelInput = (event) => {
  // Supprimer tous les caractères non numériques
  const value = event.target.value.replace(/\D/g, '')
  // Limiter à 10 chiffres
  const truncated = value.substring(0, 10)
  // Mettre à jour le modèle
  props.formData.commercial_tel = truncated
}

// Exposer la méthode de validation
defineExpose({
  validate: () => isTelValid.value
})
</script>

<template>
  <Card class="shadow-sm mb-4">
    <template #title>
      <div class="flex items-center gap-2 text-primary mb-4">
        <UserCircle class="w-5 h-5" />
        <h2>Informations Commerciales</h2>
      </div>
    </template>

    <template #content>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Nom -->
        <div class="grid gap-2">
          <FloatLabel variant="in">
            <IconField>
              <InputIcon><User class="h-4 w-4"/></InputIcon>
              <InputText
                id="commercial_nom"
                v-model="formData.commercial_nom"
                fluid
              />
            </IconField>
            <label for="commercial_nom" class="text-primary">Nom</label>
          </FloatLabel>
        </div>

        <!-- Prénom -->
        <div class="grid gap-2">
          <FloatLabel variant="in">
            <IconField>
              <InputIcon><User class="h-4 w-4"/></InputIcon>
              <InputText
                id="commercial_prenom"
                v-model="formData.commercial_prenom"
                fluid
              />
            </IconField>
            <label for="commercial_prenom" class="text-primary">Prénom</label>
          </FloatLabel>
        </div>

        <!-- Fonction -->
        <div class="grid gap-2">
          <FloatLabel variant="in">
            <IconField>
              <InputIcon><Briefcase class="h-4 w-4"/></InputIcon>
              <InputText
                id="commercial_fonction"
                v-model="formData.commercial_fonction"
                fluid
              />
            </IconField>
            <label for="commercial_fonction" class="text-primary">Fonction</label>
          </FloatLabel>
        </div>

        <!-- Téléphone -->
        <div class="grid gap-2">
          <FloatLabel variant="in">
            <IconField>
              <InputIcon><Phone class="h-4 w-4"/></InputIcon>
              <InputText
                id="commercial_tel"
                v-model="formData.commercial_tel"
                type="tel"
                maxlength="10"
                :invalid="showTelError"
                @input="handleTelInput"
                fluid
              />
            </IconField>
            <label for="commercial_tel" class="text-primary">Téléphone</label>
          </FloatLabel>
          <small v-if="showTelError" class="text-red-500">
            Le téléphone doit contenir 10 chiffres
          </small>
        </div>

        <!-- Rue -->
        <div class="grid gap-2 col-span-1 md:col-span-2">
          <FloatLabel variant="in">
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

        <!-- Code Postal -->
        <div class="grid gap-2">
          <FloatLabel variant="in">
            <IconField>
              <InputIcon><MapPin class="h-4 w-4"/></InputIcon>
              <InputText
                id="commercial_cp"
                v-model="formData.commercial_cp"
                fluid
              />
            </IconField>
            <label for="commercial_cp" class="text-primary">Code Postal</label>
          </FloatLabel>
        </div>

        <!-- Ville -->
        <div class="grid gap-2">
          <FloatLabel variant="in">
            <IconField>
              <InputIcon><MapPin class="h-4 w-4"/></InputIcon>
              <InputText
                id="commercial_ville"
                v-model="formData.commercial_ville"
                fluid
              />
            </IconField>
            <label for="commercial_ville" class="text-primary">Ville</label>
          </FloatLabel>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
:deep(.p-inputtext) {
  width: 100%;
}

:deep([invalid="true"]),
:deep(.p-invalid) {
  border-color: var(--red-500) !important;
}
</style>
