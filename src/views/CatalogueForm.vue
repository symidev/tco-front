<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Slider from 'primevue/slider';
import ProgressSpinner from 'primevue/progressspinner';
import RadioButton from 'primevue/radiobutton';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import FloatLabel from 'primevue/floatlabel';
import Select from 'primevue/select';
import { catalogueService } from '@/services/api/catalogueService';
import { Save, RefreshCw, Type, FileText, FolderOpen, Clock, Percent, Battery, Zap } from 'lucide-vue-next';
import { useStore } from 'vuex';
import { typeRechargeOptions } from '@/lib/constants.js';

const props = defineProps({
  mode: {
    type: String,
    default: 'add'
  },
  uuid: {
    type: String,
    default: null
  }
});

const router = useRouter();
const store = useStore();
const toast = useToast();

const loading = ref(false);
const saving = ref(false);

const isUser = computed(() => {
  const siteIsDefault = store.getters['siteData/getNestedData']('site', 'is-default');
  if (store.state.auth?.tokenInfo?.drupal && store.state.auth?.tokenInfo?.drupal?.isDefault) {
    return store.state.auth.tokenInfo.drupal?.isDefault ?? siteIsDefault;
  }
  return siteIsDefault;
});

const chargePatronaleUser = computed(() => {
  const siteChargePatronaleDefault = store.getters['siteData/getNestedData']('site', 'charge-patronale-default');
  if (store.state.auth?.tokenInfo?.drupal && store.state.auth?.tokenInfo?.drupal?.chargePatronaleDefault) {
    return store.state.auth.tokenInfo.drupal?.chargePatronaleDefault ?? siteChargePatronaleDefault;
  }
  return siteChargePatronaleDefault;
});

const formData = ref({
  title: '',
  field_catalogue_description: '',
  field_charge_patronale: chargePatronaleUser.value,
  field_is: isUser.value,
  field_autonomie_elec_plage_min: 10,
  field_autonomie_elec_plage_max: 80,
  field_type_recharge: null
});

// Computed pour le slider d'autonomie
const plageAutonomie = computed({
  get() {
    return [formData.value.field_autonomie_elec_plage_min, formData.value.field_autonomie_elec_plage_max];
  },
  set(value) {
    formData.value.field_autonomie_elec_plage_min = value[0];
    formData.value.field_autonomie_elec_plage_max = value[1];
  }
});

const pageTitle = computed(() => {
  return props.mode === 'edit' ? 'Éditer un catalogue' : 'Créer un catalogue';
});

const loadCatalogueData = async () => {
  if (props.mode !== 'edit' || !props.uuid) return;

  loading.value = true;
  try {
    const response = await catalogueService.getCatalogueByUuid(props.uuid);
    const catalogue = response.data;

    formData.value = {
      uuid: catalogue.uuid,
      title: catalogue.title,
      field_catalogue_description: catalogue.description || '',
      field_charge_patronale: catalogue.charge_patronale,
      field_is: catalogue.is,
      field_autonomie_elec_plage_min: catalogue.autonomie_elec_plage_min || 10,
      field_autonomie_elec_plage_max: catalogue.autonomie_elec_plage_max || 80,
      field_type_recharge: catalogue.type_recharge || null
    };
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données du catalogue',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  loadCatalogueData();
};

const saveCatalogue = async () => {
  saving.value = true;
  try {
    let response;

    if (props.mode === 'edit') {
      response = await catalogueService.updateCatalogue(props.uuid, formData.value);
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Le catalogue a été mis à jour avec succès',
        life: 3000
      });
      // Redirection vers la liste des catalogues
      router.push('/catalogues');
    } else {
      response = await catalogueService.createCatalogue(formData.value);
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Le catalogue a été créé avec succès',
        life: 3000
      });
      // TODO: Étapes 7-8 - Redirection temporairement modifiée
      // router.push(`/catalogue/${response.data.uuid}/categories`);
      router.push('/catalogues');
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du catalogue:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error?.response?.data?.error || 'Une erreur est survenue lors de la sauvegarde',
      life: 3000
    });
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadCatalogueData();
});
</script>

<template>
  <div class="page-container">
    <div class="page-content">
      <!-- Header avec titre -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">
              <Save class="title-icon" />
              {{ pageTitle }}
            </h1>
            <p class="page-subtitle">{{ props.mode === 'edit' ? 'Modifiez les paramètres de votre catalogue' : 'Créez un nouveau catalogue pour organiser vos comparaisons par catégories' }}</p>
          </div>
        </div>

        <!-- Bouton d'action pour le mode édition -->
        <div class="header-actions" v-if="props.mode === 'edit' && props.uuid">
          <!-- TODO: Étapes 7-8 - Bouton temporairement désactivé -->
          <Button
              v-if="mode === 'edit' && formData.uuid"
              severity="primary"
              class="btn-primary"
              outlined
              @click="$router.push(`/catalogue/${formData.uuid}/categories`)"
          >
            <FolderOpen class="w-4 h-4 mr-2"/>
            Gérer les catégories
          </Button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <ProgressSpinner class="loading-spinner" />
          <p class="loading-text">Chargement du catalogue...</p>
        </div>
      </div>

      <!-- Formulaire -->
      <div v-else class="content-grid animate-slide-in-up">
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <Type class="section-icon" />
              <h2>Informations du catalogue</h2>
            </div>
          </div>

          <div class="section-content">
            <form @submit.prevent="saveCatalogue" class="p-6">
              <div class="grid gap-6 mb-4">
                <!-- Titre -->
                <div class="form-field">
                  <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Type class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="title"
                        v-model="formData.title"
                        fluid
                        required
                      />
                    </IconField>
                    <label for="title" class="form-label">Titre *</label>
                  </FloatLabel>
                </div>

                <!-- Description -->
                <div class="form-field">
                  <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <FileText class="h-4 w-4"/>
                      </InputIcon>
                      <Textarea
                        id="description"
                        v-model="formData.field_catalogue_description"
                        style="padding-inline: 2.4rem"
                        rows="2"
                        fluid
                      />
                    </IconField>
                    <label for="description" class="form-label">Description</label>
                  </FloatLabel>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Impôt sur les sociétés -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                      <IconField>
                        <InputIcon>
                          <Percent class="h-4 w-4"/>
                        </InputIcon>
                        <InputNumber
                          id="is"
                          v-model="formData.field_is"
                          :min="0"
                          :max="100"
                          :step="1"
                          showButtons
                          fluid
                          required
                        />
                      </IconField>
                      <label for="is" class="form-label">Impôt sur les sociétés (%) *</label>
                    </FloatLabel>
                  </div>

                  <!-- Charges patronales -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                      <IconField>
                        <InputIcon>
                          <Percent class="h-4 w-4"/>
                        </InputIcon>
                        <InputNumber
                          id="charge_patronale"
                          v-model="formData.field_charge_patronale"
                          :min="0"
                          :max="100"
                          :step="1"
                          showButtons
                          fluid
                          required
                        />
                      </IconField>
                      <label for="charge_patronale" class="form-label">Charges patronales (%) *</label>
                    </FloatLabel>
                  </div>
                </div>

                <!-- Section Véhicules électriques -->
                <div class="form-field">
                  <div class="mb-4">
                    <div class="flex items-center gap-2">
                      <Battery class="h-5 w-5 text-primary-500"/>
                      <h3 class="text-lg font-semibold">Configuration véhicules électriques</h3>
                    </div>
                    <p class="text-sm text-gray-500 mt-1">Ces paramètres seront utilisés pour l'analyse des véhicules électriques de cette catégorie.</p>
                  </div>

                  <!-- Type de recharge -->
                  <div class="mb-4">
                    <FloatLabel variant="in">
                      <IconField>
                        <InputIcon>
                          <Zap class="h-4 w-4"/>
                        </InputIcon>
                        <Select
                          id="type_recharge"
                          v-model="formData.field_type_recharge"
                          :options="typeRechargeOptions"
                          optionLabel="label"
                          optionValue="value"
                          fluid
                        />
                      </IconField>
                      <label for="type_recharge" class="form-label">Type de recharge par défaut</label>
                    </FloatLabel>
                  </div>

                  <!-- Plage d'autonomie avec slider -->
                  <div class="form-field">
                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                      <Zap class="inline h-4 w-4 mr-2"/>
                      Plage d'autonomie (%) *
                    </label>
                    <div class="flex items-center gap-3 px-3">
                      <span class="text-sm font-medium text-surface-600 dark:text-surface-400 min-w-[2.5rem] text-center">
                        {{ plageAutonomie[0] }}%
                      </span>
                      <Slider
                        v-model="plageAutonomie"
                        range
                        :min="0"
                        :max="100"
                        :step="1"
                        class="flex-1"
                      />
                      <span class="text-sm font-medium text-surface-600 dark:text-surface-400 min-w-[2.5rem] text-center">
                        {{ plageAutonomie[1] }}%
                      </span>
                    </div>
                    <div class="text-xs text-surface-500 dark:text-surface-400 mt-2 px-3">
                      Définit la plage d'autonomie électrique pour les calculs de TCO
                    </div>
                  </div>

                </div>
              </div>

              <!-- Boutons d'action -->
              <div class="flex flex-row flex-wrap items-center justify-center sm:justify-between gap-4 mt-6">
                <Button
                    type="button"
                    outlined
                    @click="router.push('/catalogues')"
                    class="btn-primary w-[200px] min-w-[200px]"
                >
                  Retour Catalogues
                </Button>

                <Button
                    v-if="props.mode === 'edit'"
                    type="button"
                    outlined
                    severity="secondary"
                    @click="resetForm"
                    class="btn-primary w-[200px] min-w-[200px]"
                >
                  <RefreshCw class="h-4 w-4 mr-2"/>
                  Réinitialiser
                </Button>

                <Button
                    type="submit"
                    severity="primary"
                    :disabled="saving"
                    class="btn-primary w-[200px] min-w-[200px]"
                >
                  <ProgressSpinner v-if="saving" style="width:16px;height:16px" strokeWidth="8" class="mr-2"/>
                  <Save v-else class="h-4 w-4 mr-2"/>
                  {{ saving ? 'Enregistrement...' : 'Sauvegarder' }}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
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
</style>
