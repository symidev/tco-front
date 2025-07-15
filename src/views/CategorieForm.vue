<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import RadioButton from 'primevue/radiobutton';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import FloatLabel from 'primevue/floatlabel';
import { catalogueService } from '@/services/api/catalogueService';
import { Save, RefreshCw, Type, Car, Clock, ArrowLeft, Folder } from 'lucide-vue-next';

const props = defineProps({
  mode: {
    type: String,
    default: 'add'
  },
  catalogueUuid: {
    type: String,
    required: true
  },
  categorieUuid: {
    type: String,
    default: null
  }
});

const router = useRouter();
const route = useRoute();
const toast = useToast();
const store = useStore();

const loading = ref(false);
const saving = ref(false);

// Variables plus nécessaires - supprimées

const formData = ref({
  title: '',
  field_km: 120000,
  field_duree: 36,
  field_aen_repartition: 'pro',
  field_aen_type: 'loyer'
});

const pageTitle = computed(() => {
  return props.mode === 'edit' ? 'Éditer une catégorie' : 'Créer une catégorie';
});

const loadCategorieData = async () => {
  if (props.mode !== 'edit' || !props.categorieUuid) return;

  loading.value = true;
  try {
    const response = await catalogueService.getCategorieByUuid(props.catalogueUuid, props.categorieUuid);
    const categorie = response.data;

    formData.value = {
      title: categorie.title,
      field_km: categorie.km,
      field_duree: categorie.duree,
      field_aen_repartition: categorie.aen_repartition,
      field_aen_type: categorie.aen_type
    };
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données de la catégorie',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  loadCategorieData();
};

const saveCategorie = async () => {
  saving.value = true;
  try {
    let response;

    // Transformation des données pour le backend selon le mapping
    const backendData = {
      title: formData.value.title,
      km: formData.value.field_km,
      duree: formData.value.field_duree,
      aen_repartition: formData.value.field_aen_repartition,
      aen_type: formData.value.field_aen_type
    };

    console.log('Données transformées pour le backend:', backendData);

    if (props.mode === 'edit') {
      response = await catalogueService.updateCategorie(props.catalogueUuid, props.categorieUuid, backendData);
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'La catégorie a été mise à jour avec succès',
        life: 3000
      });
    } else {
      response = await catalogueService.createCategorie(props.catalogueUuid, backendData);
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'La catégorie a été créée avec succès',
        life: 3000
      });
    }

    // Redirection vers la gestion des catégories du catalogue
    router.push(`/catalogue/${props.catalogueUuid}/categories`);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder la catégorie',
      life: 3000
    });
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadCategorieData();
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
              <Folder class="title-icon" />
              {{ pageTitle }}
            </h1>
            <p class="page-subtitle">{{ props.mode === 'edit' ? 'Modifiez les paramètres de votre catégorie' : 'Créez une nouvelle catégorie pour organiser vos véhicules' }}</p>
          </div>
        </div>

        <!-- Bouton d'action -->
        <div class="header-actions">
          <Button
              severity="primary"
              class="btn-primary"
              v-if="!loading && props.mode === 'edit' && props.categorieUuid"
              @click="router.push(`/catalogue/${props.catalogueUuid}/categories/${props.categorieUuid}/vehicules`)"
              outlined
          >
            <Car class="w-4 h-4 mr-2"/>
            Gérer les véhicules
          </Button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <ProgressSpinner class="loading-spinner" />
          <p class="loading-text">Chargement de la catégorie...</p>
        </div>
      </div>

      <!-- Formulaire -->
      <div v-else class="content-grid animate-slide-in-up">
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <Type class="section-icon" />
              <h2>Informations de la catégorie</h2>
            </div>
          </div>

          <div class="section-content">
            <form @submit.prevent="saveCategorie" class="p-6">
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

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Kilométrage -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                      <IconField>
                        <InputIcon>
                          <Car class="h-4 w-4"/>
                        </InputIcon>
                        <InputNumber
                          id="km"
                          v-model="formData.field_km"
                          :min="0"
                          :step="1000"
                          showButtons
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
                        <InputNumber
                          id="duree"
                          v-model="formData.field_duree"
                          :min="1"
                          :max="72"
                          :step="1"
                          showButtons
                          fluid
                          required
                        />
                      </IconField>
                      <label for="duree" class="form-label">Durée (mois) *</label>
                    </FloatLabel>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Répartition AEN -->
                  <div class="form-field">
                    <label class="form-label">Répartition AEN *</label>
                    <div class="flex flex-col gap-3 mt-2">
                      <div class="flex items-center gap-2">
                        <RadioButton 
                            id="aen_repartition_pro" 
                            v-model="formData.field_aen_repartition" 
                            value="pro" 
                        />
                        <label for="aen_repartition_pro" class="text-sm font-medium cursor-pointer">Pro</label>
                      </div>
                      <div class="flex items-center gap-2">
                        <RadioButton 
                            id="aen_repartition_perso_pro" 
                            v-model="formData.field_aen_repartition" 
                            value="perso_pro" 
                        />
                        <label for="aen_repartition_perso_pro" class="text-sm font-medium cursor-pointer">Perso/Pro</label>
                      </div>
                    </div>
                  </div>

                  <!-- Base de calcul AEN -->
                  <div class="form-field">
                    <label class="form-label">Base de calcul AEN *</label>
                    <div class="flex flex-col gap-3 mt-2">
                      <div class="flex items-center gap-2">
                        <RadioButton 
                            id="aen_type_loyer" 
                            v-model="formData.field_aen_type" 
                            value="loyer" 
                        />
                        <label for="aen_type_loyer" class="text-sm font-medium cursor-pointer">Loyer</label>
                      </div>
                      <div class="flex items-center gap-2">
                        <RadioButton 
                            id="aen_type_prix" 
                            v-model="formData.field_aen_type" 
                            value="prix" 
                        />
                        <label for="aen_type_prix" class="text-sm font-medium cursor-pointer">Prix (remisé)</label>
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
                    @click="router.push(`/catalogue/${props.catalogueUuid}/categories`)"
                    class="btn-primary w-[200px] min-w-[200px]"
                >
                  Retour Catégories
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