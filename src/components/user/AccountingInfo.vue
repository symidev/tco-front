<script setup>
import { Landmark } from 'lucide-vue-next'

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

// Émission d'événement pour mettre à jour le parent
const emit = defineEmits(['update:show-comptable-info'])

// Fonction appelée quand le toggle change
const handleToggleChange = (event) => {
  emit('update:show-comptable-info', event.target.checked)
}
</script>

<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 class="card-title flex items-center gap-2">
          <Landmark class="w-5 h-5" />
          Informations Comptables
        </h2>

        <div class="form-control">
          <label class="label cursor-pointer">
            <input
                type="checkbox"
                :checked="showComptableInfo"
                @change="handleToggleChange"
                class="toggle toggle-primary"
            />
            <span class="label-text ml-2">{{ showComptableInfo ? 'Masquer' : 'Afficher' }}</span>
          </label>
        </div>
      </div>

      <div v-if="showComptableInfo" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Nom</span>
          </label>
          <input
              v-model="formData.comptable_nom"
              type="text"
              class="input input-bordered w-full"
              placeholder="Nom"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Prénom</span>
          </label>
          <input
              v-model="formData.comptable_prenom"
              type="text"
              class="input input-bordered w-full"
              placeholder="Prénom"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Fonction</span>
          </label>
          <input
              v-model="formData.comptable_fonction"
              type="text"
              class="input input-bordered w-full"
              placeholder="Fonction"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Email</span>
          </label>
          <input
              v-model="formData.comptable_email"
              type="email"
              class="input input-bordered w-full"
              placeholder="Email"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Téléphone</span>
          </label>
          <input
              v-model="formData.comptable_tel"
              type="tel"
              class="input input-bordered w-full"
              placeholder="Téléphone"
          />
        </div>

        <div class="form-control w-full col-span-1 md:col-span-2">
          <label class="label">
            <span class="label-text">Rue</span>
          </label>
          <input
              v-model="formData.comptable_rue"
              type="text"
              class="input input-bordered w-full"
              placeholder="Rue"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Code Postal</span>
          </label>
          <input
              v-model="formData.comptable_cp"
              type="text"
              class="input input-bordered w-full"
              placeholder="Code Postal"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Ville</span>
          </label>
          <input
              v-model="formData.comptable_ville"
              type="text"
              class="input input-bordered w-full"
              placeholder="Ville"
          />
        </div>
      </div>

      <div v-else class="text-center py-4 text-neutral-content">
        <p>Les informations comptables ne sont pas renseignées.</p>
        <p class="text-sm mt-2">Activez l'interrupteur pour ajouter des informations comptables.</p>
      </div>
    </div>
  </div>
</template>
