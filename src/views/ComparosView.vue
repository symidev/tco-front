<script setup>
import {ref, onMounted, computed, h} from 'vue';
import ProgressSpinner from 'primevue/progressspinner';
import {useStore} from 'vuex'
import Card from 'primevue/card'
import ComparoDataTable from '@/components/ui/DataTableComparo.vue'
import {useRouter} from 'vue-router'
import {Edit, Trash2, Eye, FileSpreadsheet, FileText, Car, Plus, TrendingUp, Clock, CheckCircle2, BarChart3} from 'lucide-vue-next';
import {useToast} from 'primevue/usetoast';
import {useConfirm} from "primevue/useconfirm";
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import Slider from 'primevue/slider';

import {comparoService} from '@/services/api/comparoService';
import {formatShortDate} from '@/lib/date.js'

const store = useStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm();

const itemPerPage = 3;

// États réactifs
const comparos = ref({
  progress: [],
  completed: []
});
const loading = ref(false);

// Variables pour le dialog d'analyse
const showAnalyzeDialog = ref(false);
const selectedComparo = ref(null);
const typeRecharge = ref(null);
const plageElec = ref([10, 80]);

// Options pour le type de recharge
const typeRechargeOptions = [
  { label: '2.3 kW', value: 2.3 },
  { label: '3.7 kW', value: 3.7 },
  { label: '7.4 kW', value: 7.4 },
  { label: '11 kW', value: 11 },
  { label: '22 kW', value: 22 },
  { label: '50 kW', value: 50 },
  { label: '100 kW', value: 100 },
  { label: '150 kW', value: 150 },
  { label: '200 kW', value: 200 }
];

const maxVehicule = computed(() => {
  if (store.state.auth?.tokenInfo?.drupal && store.state.auth?.tokenInfo?.drupal?.nbMaxVehicules) {
    return store.state.auth.tokenInfo.drupal?.nbMaxVehicules ?? 3;
  }
  return 3;
})
const maxComparos = computed(() => {
  if (store.state.auth?.tokenInfo?.drupal && store.state.auth?.tokenInfo?.drupal?.nbMaxComparos) {
    return store.state.auth.tokenInfo.drupal?.nbMaxComparos ?? 3;
  }
  return 3;
})

// Fonction pour récupérer les comparos
const fetchComparos = async () => {
  loading.value = true;

  try {
    const response = await comparoService.getAllComparos();
    // S'assurer que la structure est correcte
    comparos.value = {
      progress: response.data?.progress || [],
      completed: response.data?.completed || []
    };
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur de chargement',
      detail: 'Impossible de charger les comparos',
      life: 5000
    });
    // S'assurer que les tableaux sont vides en cas d'erreur
    comparos.value = {
      progress: [],
      completed: []
    };
  } finally {
    loading.value = false;
  }
};

const deleteComparo = async (comparo) => {

  confirm.require({
    message: 'Êtes vous sur de vouloir supprimer ce comparo?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Annuler',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Confirmer'
    },
    accept: () => {
      loading.value = true;
      const response = comparoService.deleteComparoByUuid(comparo.uuid).then(response => {
        toast.add({
          severity: 'success',
          summary: 'Suppression réussie',
          detail: 'Le comparo a été supprimé avec succès',
          life: 3000
        });
        fetchComparos();
      }).catch(err => {
        toast.add({
          severity: 'error',
          summary: 'Erreur de suppression',
          detail: 'Impossible de supprimer le comparo',
          life: 5000
        });
      }).finally(() => {
        loading.value = false;
      })
    },
    reject: () => {
    }
  });
}

const getCountVehiculeStyle = (count) => {
  if (count === 0) {
    return {text: '0/' + maxVehicule.value.toString(), class: 'text-red-500'};
  } else if (count === maxVehicule.value) {
    return {text: count.toString() + '/' + maxVehicule.value.toString(), class: 'text-green-500'};
  } else {
    return {text: count.toString() + '/' + maxVehicule.value.toString(), class: 'text-surface-100'};
  }
}

// Fonction pour créer un template d'icône avec h()
const createIconTemplate = (IconComponent) => {
  return () => h(IconComponent, {class: 'w-4 h-4'});
};

// Menu pour les comparos en cours
const getProgressMenuItems = (comparo) => {
  const items = [
    {
      label: 'Éditer',
      icon: Edit,
      command: () => {
        router.push(`/comparo/${comparo.uuid}`);
      }
    },
    {
      label: 'Gérer les véhicules',
      icon: Car,
      command: () => {
        router.push(`/comparo/${comparo.uuid}/vehicules`);
      }
    },
    {
      label: 'Lancer l\'analyse',
      condition: comparo.countVehicule > 1,
      icon: Car,
      command: () => {
        openAnalyzeDialog(comparo);
      }
    },
    {
      label: 'Supprimer',
      icon: Trash2,
      command: () => {
        deleteComparo(comparo)
      }
    }
  ];
  return items.filter(item => !item.hasOwnProperty('condition') || item.condition === true);
};

// Fonction utilitaire pour télécharger un fichier
const downloadFile = async (fileInfo, errorMessage) => {
  if (!fileInfo?.url) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: errorMessage || 'Le fichier n\'est pas disponible',
      life: 3000
    });
    return;
  }

  try {
    // Afficher un indicateur de chargement si nécessaire
    loading.value = true;

    // Télécharger le fichier via fetch
    const response = await fetch(fileInfo.url);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    // Créer un blob à partir de la réponse
    const blob = await response.blob();

    // Créer une URL pour le blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Créer un lien pour télécharger le blob
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileInfo.filename || 'export';

    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();

    // Nettoyer
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur de téléchargement',
      detail: 'Impossible de télécharger le fichier',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Menu pour les comparos historiques
const getCompletedMenuItems = (comparo) => {
  return [
    {
      label: 'Voir l\'analyse',
      icon: Eye,
      command: () => {
        router.push(`/comparo/${comparo.uuid}/analyse`);
      }
    },
    {
      label: 'Exporter les données',
      icon: FileSpreadsheet,
      command: () => {
        // Télécharger le fichier XLS depuis l'URL fournie
        downloadFile(comparo.export_xls, 'Le fichier XLS n\'est pas disponible');
      }
    },
    {
      label: 'Télécharger l\'analyse',
      icon: FileText,
      command: () => {
        // Ouvrir le PDF dans un nouvel onglet
        if (comparo.export_pdf?.url) {
          window.open(comparo.export_pdf.url, '_blank');
        } else {
          toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Le fichier PDF n\'est pas disponible',
            life: 3000
          });
        }
      }
    }/*,
    {
      label: 'Télécharger le PDF',
      icon: Download,
      command: () => {
        // Télécharger le fichier PDF depuis l'URL fournie
        downloadFile(comparo.export_pdf, 'Le fichier PDF n\'est pas disponible');
      }
    }*/
  ];
};

// Fonction pour ouvrir le dialog d'analyse
const openAnalyzeDialog = (comparo) => {
  selectedComparo.value = comparo;
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
    console.log('Véhicules analysés:', response.data.vehicules);
    router.push(`/comparo/${selectedComparo.value.uuid}/analyse`);
    closeAnalyzeDialog();
  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
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

// Équivalent à mounted dans l'option API
onMounted(() => {
  fetchComparos();
});
</script>

<template>
  <div class="page-container">
    <div class="page-content">
      <!-- Header avec titre et bouton -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">
              <BarChart3 class="title-icon" />
              Comparatifs véhicules
            </h1>
            <p class="page-subtitle">Gérez et analysez vos comparaisons de véhicules</p>
          </div>
        </div>

        <!-- Bouton d'action -->
        <div class="header-actions">
          <Button
              severity="primary"
              class="btn-primary"
              v-if="(comparos?.progress.length + comparos?.completed.length < maxComparos || maxComparos === -1) && !loading"
              @click="router.push('/comparo/add')"
              outlined
          >
            <Plus class="w-4 h-4 mr-2"/>
            Nouveau comparo
          </Button>
        </div>
      </div>

      <!-- Statistiques en pleine largeur -->
      <div class="stats-container">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-icon-progress">
              <Clock class="w-5 h-5" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ comparos?.progress.length || 0 }}</div>
              <div class="stat-label">En cours</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon-completed">
              <CheckCircle2 class="w-5 h-5" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ comparos?.completed.length || 0 }}</div>
              <div class="stat-label">Terminés</div>
            </div>
          </div>

          <div class="stat-card" v-if="maxComparos !== -1">
            <div class="stat-icon stat-icon-total">
              <TrendingUp class="w-5 h-5" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ comparos?.progress.length + comparos?.completed.length }}/{{ maxComparos }}</div>
              <div class="stat-label">Total utilisé</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <ProgressSpinner class="loading-spinner" />
          <p class="loading-text">Chargement des comparos...</p>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="content-grid animate-slide-in-up">
        <!-- Section En cours -->
        <div class="section-card section-progress">
          <div class="section-header">
            <div class="section-title">
              <Clock class="section-icon" />
              <h2>Comparos en cours</h2>
              <div class="section-badge section-badge-progress">
                {{ comparos?.progress.length || 0 }}
              </div>
            </div>
          </div>

          <div class="section-content">
            <ComparoDataTable
                :data="comparos.progress"
                title="Comparos en cours"
                :rows-per-page="itemPerPage"
                :count-vehicule-getter="getCountVehiculeStyle"
                :date-formatter="formatShortDate"
                empty-message="Aucun comparo en cours"
                :menu-items="getProgressMenuItems"
            />
          </div>
        </div>

        <!-- Section Historique -->
        <div class="section-card section-completed">
          <div class="section-header">
            <div class="section-title">
              <CheckCircle2 class="section-icon" />
              <h2>Historique</h2>
              <div class="section-badge section-badge-completed">
                {{ comparos?.completed.length || 0 }}
              </div>
            </div>
          </div>

          <div class="section-content">
            <ComparoDataTable
                :data="comparos.completed"
                title="Historique"
                :rows-per-page="itemPerPage"
                :count-vehicule-getter="getCountVehiculeStyle"
                :date-formatter="formatShortDate"
                empty-message="Aucun comparo dans l'historique"
                :menu-items="getCompletedMenuItems"
                :show-analyse-column="true"
                :show-created-column="false"
            />
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




.loading-spinner {
  margin-bottom: 1rem;
}


.section-card {
  animation: slideInUp 0.6s ease-out;
  animation-fill-mode: both;
}

.section-card:nth-child(1) { animation-delay: 0.1s; }
.section-card:nth-child(2) { animation-delay: 0.2s; }


/* Styles pour les icônes de menu */
:deep(.p-menuitem-icon) {
  margin-right: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Amélioration des DataTables */
:deep(.p-card) {
  box-shadow: none !important;
  border: none !important;
}

:deep(.p-card-content) {
  padding: 0 !important;
}
</style>
