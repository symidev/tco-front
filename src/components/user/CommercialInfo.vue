<script setup>
import { UserCircle } from 'lucide-vue-next'

// Props
const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h2 class="card-title flex items-center gap-2">
        <UserCircle class="w-5 h-5" />
        Informations Commerciales
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Nom</span>
          </label>
          <input
              v-model="formData.commercial_nom"
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
              v-model="formData.commercial_prenom"
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
              v-model="formData.commercial_fonction"
              type="text"
              class="input input-bordered w-full"
              placeholder="Fonction"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Téléphone</span>
          </label>
          <input
              v-model="formData.commercial_tel"
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
              v-model="formData.commercial_rue"
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
              v-model="formData.commercial_cp"
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
              v-model="formData.commercial_ville"
              type="text"
              class="input input-bordered w-full"
              placeholder="Ville"
          />
        </div>
      </div>
    </div>
  </div>
</template>
