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
        confirm.require({
          message: 'Une fois l\'analyse lancée, plus aucune modification de ce comparo ne pourra être effectuée. Souhaitez-vous continuer ?',
          header: 'Confirmation d\'analyse',
          icon: 'pi pi-info-circle',
          acceptLabel: 'Oui, lancer l\'analyse',
          rejectLabel: 'Annuler',
          acceptClass: 'p-button-primary',
          accept: async () => {
            loading.value = true;
            try {
              const response = await comparoService.analyzeComparo(comparo.uuid);
              toast.add({
                severity: 'success',
                summary: 'Analyse lancée',
                detail: 'L\'analyse du comparo a été lancée avec succès',
                life: 3000
              });
              console.log('Véhicules analysés:', response.data.vehicules);
              router.push(`/comparo/${comparo.uuid}/analyse`);
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
          }
        });
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
              class="create-btn"
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
      <div v-else class="content-grid">
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
  </div>
</template>

<style scoped>
/* Container principal */
.page-container {
  min-height: 100vh;
  padding: 2rem 1rem;
  display: flex;
  justify-content: center;
}

.page-content {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Header */
.page-header {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.title-icon {
  width: 2rem;
  height: 2rem;
  color: #f59e0b;
}

.page-subtitle {
  color: #94a3b8;
  font-size: 1rem;
  margin: 0;
}

/* Conteneur des statistiques */
.stats-container {
  width: 100%;
}

/* Statistiques */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
}

.stat-card {
  background: linear-gradient(135deg, var(--p-surface-800) 0%, var(--p-surface-700) 100%);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon-progress {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.stat-icon-completed {
  background: linear-gradient(135deg, #10b981, #047857);
}

.stat-icon-total {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--p-surface-50);
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--p-surface-200);
  font-weight: 500;
}

/* Actions */
.header-actions {
  display: flex;
  align-items: flex-start;
}

.create-btn {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Loading */
.loading-container {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.loading-card {
  background: white;
  border-radius: 1rem;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.loading-text {
  color: #64748b;
  font-weight: 500;
  margin: 0;
}

/* Content grid */
.content-grid {
  display: grid;
  gap: 2rem;
}

/* Section cards */
.section-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.section-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
}

.section-progress .section-header {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}

.section-completed .section-header {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
  flex: 1;
}

.section-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: white;
}

.section-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.section-badge-progress {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.section-badge-completed {
  background: linear-gradient(135deg, #10b981, #047857);
}

.section-content {
  padding: 0;
}

/* Animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-card {
  animation: slideInUp 0.6s ease-out;
  animation-fill-mode: both;
}

.section-card:nth-child(1) { animation-delay: 0.1s; }
.section-card:nth-child(2) { animation-delay: 0.2s; }

/* Responsive */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem 0.5rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .header-actions {
    align-self: stretch;
  }

  .create-btn {
    width: 100%;
    justify-content: center;
  }

  .section-header {
    padding: 1rem 1.5rem;
  }

  .section-title h2 {
    font-size: 1.125rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .title-icon {
    width: 1.5rem;
    height: 1.5rem;
  }
}

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
