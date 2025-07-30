<script setup>
import {ref, computed, onMounted} from 'vue';
import {useStore} from 'vuex';
import {useRouter, useRoute} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import {useConfirm} from 'primevue/useconfirm';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Menu from 'primevue/menu';
import ProgressSpinner from 'primevue/progressspinner';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import Slider from 'primevue/slider';
import {MoreVertical, Edit, Trash2, Plus, Car} from 'lucide-vue-next';

import {comparoService} from '@/services/api/comparoService';
import {typeRechargeOptions} from '@/lib/constants.js';

const store = useStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

const loading = ref(false);
const comparo = ref(null);
const menu = ref();
const selectedVehicule = ref(null);

// Variables pour le dialog d'analyse
const showAnalyzeDialog = ref(false);
const selectedComparo = ref(null);
const typeRecharge = ref(null);
const plageElec = ref([10, 80]);

const maxVehicule = computed(() => {
  if (store.state.auth?.tokenInfo?.drupal && store.state.auth?.tokenInfo?.drupal?.nbMaxVehicules) {
    return store.state.auth.tokenInfo.drupal?.nbMaxVehicules ?? 3;
  }
  return 3;
});

const canAddVehicule = computed(() => {
  if (!comparo.value?.vehicules) return false;
  return comparo.value.vehicules.length < maxVehicule.value;
});

const canAnalyze = computed(() => {
  if (!comparo.value?.vehicules) return false;
  return comparo.value.vehicules.length >= 2;
});

const hasBattery = computed(() => {
  if (!comparo.value?.vehicules) return false;
  return comparo.value.vehicules.some(vehicule => 
    vehicule.energie && ['bev', 'phev'].includes(vehicule.energie)
  );
});

const loadComparoData = async () => {
  const uuid = route.params.uuid;
  if (!uuid) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Identifiant du comparo manquant',
      life: 3000
    });
    router.push('/comparos');
    return;
  }

  loading.value = true;
  try {
    const response = await comparoService.getComparoByUuid(uuid);
    comparo.value = response.data;

    // Si le comparo a déjà été analysé, rediriger vers la liste
    if (comparo.value.export_pdf) {
      toast.add({
        severity: 'warn',
        summary: 'Comparo analysé',
        detail: 'Ce comparo a déjà été analysé et ne peut plus être modifié',
        life: 5000
      });
      router.push('/comparos');
    }
  } catch (error) {
    console.error('Erreur lors du chargement du comparo:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur de chargement',
      detail: 'Impossible de charger les données du comparo',
      life: 3000
    });
    router.push('/comparos');
  } finally {
    loading.value = false;
  }
};

const showMenu = (event, vehicule) => {
  selectedVehicule.value = vehicule;
  menu.value.toggle(event);
};

const menuItems = computed(() => {
  if (!selectedVehicule.value) return [];

  return [
    {
      label: 'Éditer',
      icon: Edit,
      command: () => {
        router.push(`/comparo/${comparo.value.uuid}/vehicules/${selectedVehicule.value.uuid}`);
      }
    },
    {
      label: 'Supprimer',
      icon: Trash2,
      command: () => {
        deleteVehicule(selectedVehicule.value);
      }
    }
  ];
});

const deleteVehicule = (vehicule) => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir supprimer ce véhicule ?',
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      loading.value = true;
      try {
        await comparoService.deleteVehiculeByUuid(comparo.value.uuid, vehicule.uuid);
        toast.add({
          severity: 'success',
          summary: 'Véhicule supprimé',
          detail: 'Le véhicule a été supprimé avec succès',
          life: 3000
        });
        // Recharger les données du comparo
        loadComparoData();
      } catch (error) {
        console.error('Erreur lors de la suppression du véhicule:', error);
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer ce véhicule',
          life: 3000
        });
      } finally {
        loading.value = false;
      }
    }
  });
};

const deleteComparo = () => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir supprimer ce comparo ?',
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      loading.value = true;
      try {
        await comparoService.deleteComparoByUuid(comparo.value.uuid);
        toast.add({
          severity: 'success',
          summary: 'Comparo supprimé',
          detail: 'Le comparo a été supprimé avec succès',
          life: 3000
        });
        router.push('/comparos');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer le comparo',
          life: 3000
        });
      } finally {
        loading.value = false;
      }
    }
  });
};

// Fonction pour ouvrir le dialog d'analyse
const openAnalyzeDialog = () => {
  selectedComparo.value = { ...comparo.value, hasBattery: hasBattery.value };
  typeRecharge.value = null;
  plageElec.value = [10, 80];
  showAnalyzeDialog.value = true;
};

// Fonction pour fermer le dialog d'analyse
const closeAnalyzeDialog = () => {
  showAnalyzeDialog.value = false;
  selectedComparo.value = null;
  typeRecharge.value = null;
  plageElec.value = [10, 80];
};

// Fonction pour confirmer l'analyse
const confirmAnalyze = async () => {
  if (selectedComparo.value?.hasBattery && !typeRecharge.value) {
    toast.add({
      severity: 'warn',
      summary: 'Champ requis',
      detail: 'Veuillez sélectionner un type de recharge',
      life: 3000
    });
    return;
  }

  loading.value = true;
  try {
    const payload = {};

    if (selectedComparo.value?.hasBattery) {
      payload.typeRecharge = typeRecharge.value;
      payload.plageElecMin = plageElec.value[0];
      payload.plageElecMax = plageElec.value[1];
    }

    const response = await comparoService.analyzeComparo(selectedComparo.value.uuid, payload);
    toast.add({
      severity: 'success',
      summary: 'Analyse lancée',
      detail: 'L\'analyse du comparo a été lancée avec succès',
      life: 3000
    });
    router.push(`/comparo/${selectedComparo.value.uuid}/analyse`);
    closeAnalyzeDialog();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Une erreur est survenue lors de l\'analyse',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const analyzeComparo = () => {
  openAnalyzeDialog();
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
              <Car class="title-icon" />
              Véhicules
              <span v-if="comparo && maxVehicule !== -1" class="ml-2 text-3xl">{{ comparo.vehicules?.length || 0 }}/{{ maxVehicule }}</span>
            </h1>
            <p class="page-subtitle">Gérez les véhicules de votre comparo</p>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <ProgressSpinner class="loading-spinner" />
          <p class="loading-text">Chargement des véhicules...</p>
        </div>
      </div>

      <!-- Contenu principal -->
      <div v-else-if="comparo" class="content-grid animate-slide-in-up">
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <Car class="section-icon" />
              <h2>{{ comparo.title }}</h2>
            </div>
          </div>
          
          <div class="section-content">
            <div class="p-6">
              <div v-if="comparo.description" class="mb-4">
                <p class="text-surface-200 font-inter">{{ comparo.description }}</p>
              </div>
              <DataTable
                  :value="comparo.vehicules"
                  responsiveLayout="scroll"
                  :scrollable="true"
                  class="p-datatable-sm"
              >
              <Column field="title" header="Titre" sortable></Column>
              <Column field="marque.name" header="Marque" sortable></Column>
              <Column field="modele.title" header="Modèle" sortable></Column>
              <Column field="loueur.name" header="Loueur" sortable></Column>
              <Column style="width: 4rem">
                <template #body="slotProps">
                  <Button
                      severity="secondary"
                      text
                      rounded
                      @click="showMenu($event, slotProps.data)"
                      class="p-2"
                  >
                    <MoreVertical class="w-5 h-5"/>
                  </Button>
                </template>
              </Column>

                <template #empty>
                  <div class="p-4 text-center text-gray-500 font-medium">
                    Aucun véhicule dans ce comparo
                  </div>
                </template>

                <template #footer>
                  <tr>
                    <td :colspan="5" class="text-center py-4">
                      <Button
                          v-if="canAddVehicule"
                          severity="secondary"
                          outlined
                          class="mx-auto btn-primary"
                          @click="router.push(`/comparo/${comparo.uuid}/vehicules/add`)"
                      >
                        <Plus class="w-4 h-4 mr-2"/>
                        <span>Ajouter un véhicule</span>
                      </Button>
                      <p v-else class="text-surface-200 font-inter font-medium">
                        Nombre maximum de véhicules atteint ({{ maxVehicule }})
                      </p>
                    </td>
                  </tr>
                </template>
              </DataTable>

              <Menu ref="menu" :model="menuItems" :popup="true">
                <template #item="{ item }">
                  <a class="p-menuitem-link flex items-center cursor-pointer text-sm">
                    <component :is="item.icon" v-if="item.icon" class="w-4 h-4 mr-2 text-primary-500"/>
                    <span class="p-menuitem-text font-medium">{{ item.label }}</span>
                  </a>
                </template>
              </Menu>

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
                    severity="danger"
                    outlined
                    @click="deleteComparo"
                    class="btn-primary"
                >
                  <Trash2 class="w-4 h-4 mr-2"/>
                  Supprimer le comparo
                </Button>

                <Button
                    severity="primary"
                    :disabled="!canAnalyze"
                    @click="analyzeComparo"
                    class="btn-primary"
                >
                  Analyser ce comparo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog d'analyse -->
    <Dialog
      v-model:visible="showAnalyzeDialog"
      modal
      :header="'Confirmation d\'analyse'"
      :style="{ width: '450px' }"
      :closable="false"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <i class="pi pi-info-circle text-blue-500"></i>
          <span class="font-semibold">Confirmation d'analyse</span>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-surface-600 dark:text-surface-400">
          Une fois l'analyse lancée, plus aucune modification de ce comparo ne pourra être effectuée. Souhaitez-vous continuer ?
        </p>

        <!-- Champs conditionnels pour les véhicules électriques -->
        <div v-if="selectedComparo?.hasBattery" class="space-y-4 p-4 bg-surface-50 dark:bg-surface-800/20 rounded-lg border border-blue-200 dark:border-surface-700">
          <div class="flex items-center gap-2 text-surface-700 dark:text-surface-300 font-medium">
            <i class="pi pi-bolt"></i>
            <span>Configuration électrique</span>
          </div>

          <!-- Type de recharge -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Type de recharge <span class="text-red-500">*</span>
            </label>
            <Select
              v-model="typeRecharge"
              :options="typeRechargeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionnez une puissance"
              class="w-full"
            />
          </div>

          <!-- Plage d'autonomie -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Plage d'autonomie (%)
            </label>
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-surface-600 dark:text-surface-400 min-w-[2rem]">
                {{ plageElec[0] }}%
              </span>
              <Slider
                v-model="plageElec"
                range
                :min="0"
                :max="100"
                :step="10"
                class="flex-1"
              />
              <span class="text-sm font-medium text-surface-600 dark:text-surface-400 min-w-[2rem]">
                {{ plageElec[1] }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Annuler"
            severity="secondary"
            outlined
            @click="closeAnalyzeDialog"
            :disabled="loading"
          />
          <Button
            label="Oui, lancer l'analyse"
            severity="primary"
            @click="confirmAnalyze"
            :loading="loading"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.5rem 1rem;
}
</style>
