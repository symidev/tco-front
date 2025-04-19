<script setup>
import { computed } from 'vue'
import { Building } from 'lucide-vue-next'

// Props
const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
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

// Toggle interest selection
const toggleInteret = (value) => {
  const index = props.formData.user_offre.indexOf(value)
  if (index === -1) {
    props.formData.user_offre.push(value)
  } else {
    props.formData.user_offre.splice(index, 1)
  }
}

// Toggle knowledge channel selection
const toggleConnaissance = (value) => {
  const index = props.formData.user_connaissance.indexOf(value)
  if (index === -1) {
    props.formData.user_connaissance.push(value)
  } else {
    props.formData.user_connaissance.splice(index, 1)
  }
}
</script>

<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h2 class="card-title flex items-center gap-2">
        <Building class="w-5 h-5" />
        Informations Société
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div class="form-control w-full col-span-1 md:col-span-2 flex flex-col sm:flex-row sm:items-center">
          <label class="label">
            <span class="label-text">Email : </span>
          </label>
          <div class="text-white text-sm ml-1">{{props.formData.email}}</div>
          <span class="label-text-alt text-primary ml-1 mt-1 sm:mt-0">(Pour modifier votre email, veuillez contacter l'administrateur)</span>
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Raison sociale</span>
          </label>
          <input
              v-model="formData.user_raison_sociale"
              type="text"
              class="input input-bordered w-full"
              placeholder="Raison sociale"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">SIRET</span>
          </label>
          <input
              v-model="formData.user_siret"
              type="text"
              class="input input-bordered w-full"
              placeholder="SIRET"
          />
        </div>
      </div>

      <!-- Preferences -->
      <div class="mt-4">
        <label class="label">
          <span class="label-text">Intérêt offre</span>
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
          <div v-for="option in interetOptions" :key="option.value" class="flex items-center gap-2">
            <input
                type="checkbox"
                :id="`interet-${option.value}`"
                :value="option.value"
                :checked="formData.user_offre.includes(option.value)"
                @change="toggleInteret(option.value)"
                class="checkbox checkbox-primary"
            />
            <label :for="`interet-${option.value}`" class="label-text">{{ option.label }}</label>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <label class="label">
          <span class="label-text">Canal de connaissance</span>
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
          <!-- Regular options (except "other") -->
          <div
              v-for="option in connaissanceOptions.filter(opt => opt.value !== 'autre')"
              :key="option.value"
              class="flex items-center gap-2"
          >
            <input
                type="checkbox"
                :id="`connaissance-${option.value}`"
                :value="option.value"
                :checked="formData.user_connaissance.includes(option.value)"
                @change="toggleConnaissance(option.value)"
                class="checkbox checkbox-primary"
            />
            <label :for="`connaissance-${option.value}`" class="label-text">{{ option.label }}</label>
          </div>
        </div>

        <!-- "Other" option -->
        <div v-if="connaissanceOptions.some(opt => opt.value === 'autre')" class="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
          <div class="flex items-center">
            <input
                type="checkbox"
                id="connaissance-autre"
                value="autre"
                :checked="formData.user_connaissance.includes('autre')"
                @change="toggleConnaissance('autre')"
                class="checkbox checkbox-primary"
            />
            <label for="connaissance-autre" class="label-text ml-2">
              {{ connaissanceOptions.find(opt => opt.value === 'autre')?.label || 'Autre' }}
            </label>
          </div>

          <input
              v-if="isOtherKnowledgeSelected"
              v-model="formData.user_connaissance_autre"
              type="text"
              class="input input-bordered w-full max-w-xs mt-2 sm:mt-0"
              placeholder="Précisez..."
          />
        </div>
      </div>
    </div>
  </div>
</template>
