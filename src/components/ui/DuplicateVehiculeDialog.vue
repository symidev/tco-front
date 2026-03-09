<!--
  DuplicateVehiculeDialog.vue

  Dialog de confirmation générique pour la duplication d'un véhicule.
  Utilisé aussi bien dans le Comparateur que dans le Catalogue.

  Props:
  - visible      : contrôle l'affichage du dialog (v-model)
  - vehiculeTitle: nom du véhicule à afficher dans le message de confirmation
  - isLoading    : affiche le spinner sur le bouton "Dupliquer"

  Emits:
  - update:visible : pour fermer via v-model
  - confirm        : l'utilisateur confirme la duplication
-->
<script setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

defineProps({
  /** Contrôle la visibilité du dialog (lié via v-model:visible) */
  visible: {
    type: Boolean,
    required: true
  },

  /** Titre du véhicule affiché dans le message de confirmation */
  vehiculeTitle: {
    type: String,
    default: 'ce véhicule'
  },

  /** Active le spinner pendant l'appel API */
  isLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'confirm']);

/** Ferme le dialog en propageant la fermeture via v-model */
const close = () => {
  emit('update:visible', false);
};

/** Déclenche la duplication (géré par le parent) */
const confirm = () => {
  emit('confirm');
};
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Dupliquer le véhicule"
    :style="{ width: '420px' }"
    @hide="close"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-copy text-primary-500"></i>
        <span class="font-semibold">Dupliquer le véhicule</span>
      </div>
    </template>

    <p class="text-surface-300 text-sm leading-relaxed">
      Voulez-vous dupliquer le véhicule
      <strong class="text-surface-100">"{{ vehiculeTitle }}"</strong> ?
      Une copie identique sera créée.
    </p>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Annuler"
          severity="secondary"
          outlined
          :disabled="isLoading"
          @click="close"
        />
        <Button
          label="Dupliquer"
          icon="pi pi-copy"
          :loading="isLoading"
          @click="confirm"
        />
      </div>
    </template>
  </Dialog>
</template>
