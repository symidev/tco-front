<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import RadioButton from 'primevue/radiobutton';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import FloatLabel from 'primevue/floatlabel';
import { comparoService } from '@/services/api/comparoService';
import { Save, RefreshCw, Type, FileText, Car, Clock, Percent } from 'lucide-vue-next';
import { useStore } from 'vuex';

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
})
const chargePatronaleUser = computed(() => {
  const siteChargePatronaleDefault = store.getters['siteData/getNestedData']('site', 'charge-patronale-default');
  if (store.state.auth?.tokenInfo?.drupal && store.state.auth?.tokenInfo?.drupal?.chargePatronaleDefault) {
    return store.state.auth.tokenInfo.drupal?.chargePatronaleDefault ?? siteChargePatronaleDefault;
  }
  return siteChargePatronaleDefault;
})

const formData = ref({
  title: '',
  field_comparo_description: '',
  field_aen_repartition: 'pro',
  field_aen_type: 'loyer',
  field_km: 120000,
  field_duree: 36,
  field_charge_patronale: chargePatronaleUser,
  field_is: isUser
});

const pageTitle = computed(() => {
  return props.mode === 'edit' ? 'Éditer un comparo' : 'Créer un comparo';
});

const loadComparoData = async () => {
  if (props.mode !== 'edit' || !props.uuid) return;

  loading.value = true;
  try {
    const response = await comparoService.getComparoByUuid(props.uuid);
    const comparo = response.data;

    formData.value = {
      title: comparo.title,
      field_comparo_description: comparo.description || '',
      field_aen_repartition: comparo.aenRepartition,
      field_aen_type: comparo.aenType,
      field_km: comparo.km,
      field_duree: comparo.duree,
      field_charge_patronale: comparo.charge_patronale,
      field_is: comparo.is
    };
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données du comparo',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  loadComparoData();
};

const saveComparo = async () => {
  saving.value = true;
  try {
    let response;

    if (props.mode === 'edit') {
      response = await comparoService.updateComparo(props.uuid, formData.value);
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Le comparo a été mis à jour avec succès',
        life: 3000
      });
      // Redirection vers la liste des comparos
      router.push('/comparos');
    } else {
      response = await comparoService.createComparo(formData.value);
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Le comparo a été créé avec succès',
        life: 3000
      });
      // Redirection vers la page d'édition du comparo nouvellement créé
      router.push(`/comparo/${response.data.uuid}/vehicules`);
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du comparo:', error);
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
  loadComparoData();
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
            <p class="page-subtitle">{{ props.mode === 'edit' ? 'Modifiez les paramètres de votre comparo' : 'Créez un nouveau comparo pour comparer vos véhicules' }}</p>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <ProgressSpinner class="loading-spinner" />
          <p class="loading-text">Chargement du comparo...</p>
        </div>
      </div>

      <!-- Formulaire -->
      <div v-else class="content-grid animate-slide-in-up">
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <Type class="section-icon" />
              <h2>Informations du comparo</h2>
            </div>
          </div>
          
          <div class="section-content">
            <form @submit.prevent="saveComparo" class="p-6">
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
                      v-model="formData.field_comparo_description"
                      style="padding-inline: 2.4rem"
                      rows="2"
                      fluid
                    />
                  </IconField>
                  <label for="description" class="form-label">Description</label>
                </FloatLabel>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- KM -->
                <div class="form-field">
                  <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Car class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="km"
                        v-model.number="formData.field_km"
                        type="number"
                        min="0"
                        fluid
                        required
                      />
                    </IconField>
                    <label for="km" class="form-label">Kilométrage *</label>
                  </FloatLabel>
                </div>

                <!-- Durée -->
                <div class="form-field">
                  <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Clock class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="duree"
                        v-model.number="formData.field_duree"
                        type="number"
                        min="1"
                        fluid
                        required
                      />
                    </IconField>
                    <label for="duree" class="form-label">Durée (mois) *</label>
                  </FloatLabel>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Impôt sur les sociétés -->
                <div class="form-field">
                  <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Percent class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="is"
                        v-model.number="formData.field_is"
                        type="number"
                        min="0"
                        max="100"
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
                      <InputText
                        id="charge_patronale"
                        v-model.number="formData.field_charge_patronale"
                        type="number"
                        min="0"
                        max="100"
                        fluid
                        required
                      />
                    </IconField>
                    <label for="charge_patronale" class="form-label">Charges patronales (%) *</label>
                  </FloatLabel>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- AEN Répartition -->
                <div class="form-field">
                  <label class="form-label">Répartition AEN *</label>
                  <div class="flex gap-4 p-2">
                    <div class="flex items-center">
                      <RadioButton
                        id="aen-pro"
                        v-model="formData.field_aen_repartition"
                        name="aen_repartition"
                        value="pro"
                      />
                      <label for="aen-pro" class="ml-2 font-inter">Pro</label>
                    </div>
                    <div class="flex items-center">
                      <RadioButton
                        id="aen-perso-pro"
                        v-model="formData.field_aen_repartition"
                        name="aen_repartition"
                        value="perso_pro"
                      />
                      <label for="aen-perso-pro" class="ml-2 font-inter">Perso/Pro</label>
                    </div>
                  </div>
                </div>

                <!-- AEN Type -->
                <div class="form-field">
                  <label class="form-label">Type AEN *</label>
                  <div class="flex gap-4 p-2">
                    <div class="flex items-center">
                      <RadioButton
                        id="aen-loyer"
                        v-model="formData.field_aen_type"
                        name="aen_type"
                        value="loyer"
                      />
                      <label for="aen-loyer" class="ml-2 font-inter">Loyer</label>
                    </div>
                    <div class="flex items-center">
                      <RadioButton
                        id="aen-prix"
                        v-model="formData.field_aen_type"
                        name="aen_type"
                        value="prix"
                      />
                      <label for="aen-prix" class="ml-2 font-inter">Prix (remisé)</label>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              
              <!-- Boutons d'action -->
              <div class="flex flex-row flex-wrap items-center justify-center sm:justify-between gap-4 mt-6">
                <Button
                    type="button"
                    outlined
                    @click="router.push('/comparos')"
                    class="btn-primary w-[200px] min-w-[200px]"
                >
                  Retour Comparos
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
