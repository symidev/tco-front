<script setup>
import { ref, computed } from 'vue'
import { Calculator, User, Phone, MapPin, Mail, Briefcase } from 'lucide-vue-next'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import FloatLabel from 'primevue/floatlabel'

// Props
const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  showComptableInfo: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show-comptable-info'])

// Toggle pour afficher/masquer les informations comptables
const toggleComptableInfo = () => {
  emit('update:show-comptable-info', !props.showComptableInfo)
}
</script>

<template>
  <Card class="shadow-sm mb-4">
    <template #title>
      <div class="flex items-center gap-2 text-primary">
        <Calculator class="w-5 h-5" />
        <h2>Informations Comptables</h2>
      </div>
    </template>

    <template #content>
      <div class="grid gap-6">
        <!-- Checkbox pour activer les informations comptables -->
        <div class="flex items-center gap-2 mt-2">
          <Checkbox
            id="show_comptable_info"
            :modelValue="showComptableInfo"
            @update:modelValue="toggleComptableInfo"
            binary
          />
          <label for="show_comptable_info" class="text-sm">
            Renseigner les informations comptables (adresse de facturation différente)
          </label>
        </div>

        <div v-if="showComptableInfo" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <!-- Nom -->
          <div class="grid gap-2">
            <FloatLabel variant="in">
              <IconField>
                <InputIcon><User class="h-4 w-4"/></InputIcon>
                <InputText
                  id="comptable_nom"
                  v-model="formData.comptable_nom"
                  fluid
                />
              </IconField>
              <label for="comptable_nom" class="text-primary">Nom</label>
            </FloatLabel>
          </div>

          <!-- Prénom -->
          <div class="grid gap-2">
            <FloatLabel variant="in">
              <IconField>
                <InputIcon><User class="h-4 w-4"/></InputIcon>
                <InputText
                  id="comptable_prenom"
                  v-model="formData.comptable_prenom"
                  fluid
                />
              </IconField>
              <label for="comptable_prenom" class="text-primary">Prénom</label>
            </FloatLabel>
          </div>

          <!-- Fonction -->
          <div class="grid gap-2">
            <FloatLabel variant="in">
              <IconField>
                <InputIcon><Briefcase class="h-4 w-4"/></InputIcon>
                <InputText
                  id="comptable_fonction"
                  v-model="formData.comptable_fonction"
                  fluid
                />
              </IconField>
              <label for="comptable_fonction" class="text-primary">Fonction</label>
            </FloatLabel>
          </div>

          <!-- Email -->
          <div class="grid gap-2">
            <FloatLabel variant="in">
              <IconField>
                <InputIcon><Mail class="h-4 w-4"/></InputIcon>
                <InputText
                  id="comptable_email"
                  v-model="formData.comptable_email"
                  type="email"
                  fluid
                />
              </IconField>
              <label for="comptable_email" class="text-primary">Email</label>
            </FloatLabel>
          </div>

          <!-- Téléphone -->
          <div class="grid gap-2">
            <FloatLabel variant="in">
              <IconField>
                <InputIcon><Phone class="h-4 w-4"/></InputIcon>
                <InputText
                  id="comptable_tel"
                  v-model="formData.comptable_tel"
                  type="tel"
                  fluid
                />
              </IconField>
              <label for="comptable_tel" class="text-primary">Téléphone</label>
            </FloatLabel>
          </div>

          <!-- Rue -->
          <div class="grid gap-2 col-span-1 md:col-span-2">
            <FloatLabel variant="in">
              <IconField>
                <InputIcon><MapPin class="h-4 w-4"/></InputIcon>
                <InputText
                  id="comptable_rue"
                  v-model="formData.comptable_rue"
                  fluid
                />
              </IconField>
              <label for="comptable_rue" class="text-primary">Rue</label>
            </FloatLabel>
          </div>

          <!-- Code Postal -->
          <div class="grid gap-2">
            <FloatLabel variant="in">
              <IconField>
                <InputIcon><MapPin class="h-4 w-4"/></InputIcon>
                <InputText
                  id="comptable_cp"
                  v-model="formData.comptable_cp"
                  fluid
                />
              </IconField>
              <label for="comptable_cp" class="text-primary">Code Postal</label>
            </FloatLabel>
          </div>

          <!-- Ville -->
          <div class="grid gap-2">
            <FloatLabel variant="in">
              <IconField>
                <InputIcon><MapPin class="h-4 w-4"/></InputIcon>
                <InputText
                  id="comptable_ville"
                  v-model="formData.comptable_ville"
                  fluid
                />
              </IconField>
              <label for="comptable_ville" class="text-primary">Ville</label>
            </FloatLabel>
          </div>
        </div>

        <div v-else class="text-center py-4 text-gray-500">
          <p>Les informations comptables ne sont pas renseignées.</p>
          <p class="text-sm mt-2">Cochez la case pour ajouter des informations comptables.</p>
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
