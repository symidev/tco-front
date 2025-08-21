<script setup>
import { ref, onMounted, computed, h } from 'vue';
import ProgressSpinner from 'primevue/progressspinner';
import { useStore } from 'vuex';
import Card from 'primevue/card';
import DataTableCatalogue from '@/components/ui/DataTableCatalogue.vue';
import { useRouter } from 'vue-router';
import { Edit, Trash2, Eye, FileSpreadsheet, FileText, FolderOpen, Plus, TrendingUp, Clock, CheckCircle2, BookOpen } from 'lucide-vue-next';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from "primevue/useconfirm";
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import { catalogueService } from '@/services/api/catalogueService';
import { formatShortDate } from '@/lib/date.js';

const store = useStore();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const itemPerPage = 3;

// États réactifs
const catalogues = ref({
  progress: [],
  completed: []
});
const loading = ref(false);

// Variables pour le dialog d'analyse
const showAnalyzeDialog = ref(false);
const selectedCatalogue = ref(null);


const maxCategories = computed(() => {
  // Maximum 5 catégories par catalogue (en dur comme demandé)
  return 5;
});

// Fonction pour récupérer les catalogues
const fetchCatalogues = async () => {
  loading.value = true;

  try {
    const response = await catalogueService.getAllCatalogues();
    // S'assurer que la structure est correcte
    catalogues.value = {
      progress: response.data?.progress || [],
      completed: response.data?.completed || []
    };
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur de chargement',
      detail: 'Impossible de charger les catalogues',
      life: 5000
    });
    // S'assurer que les tableaux sont vides en cas d'erreur
    catalogues.value = {
      progress: [],
      completed: []
    };
  } finally {
    loading.value = false;
  }
};

const deleteCatalogue = async (catalogue) => {
  confirm.require({
    message: 'Êtes vous sûr de vouloir supprimer ce catalogue ?',
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
      catalogueService.deleteCatalogueByUuid(catalogue.uuid).then(response => {
        toast.add({
          severity: 'success',
          summary: 'Suppression réussie',
          detail: 'Le catalogue a été supprimé avec succès',
          life: 3000
        });
        fetchCatalogues();
      }).catch(err => {
        toast.add({
          severity: 'error',
          summary: 'Erreur de suppression',
          detail: 'Impossible de supprimer le catalogue',
          life: 5000
        });
      }).finally(() => {
        loading.value = false;
      });
    },
    reject: () => {
    }
  });
};

const getCountCategoriesStyle = (count) => {
  if (count === 0) {
    return { text: '0/' + maxCategories.value.toString(), class: 'text-red-500' };
  } else if (count >= 2 && count <= maxCategories.value) {
    return { text: count.toString() + '/' + maxCategories.value.toString(), class: 'text-green-500' };
  } else {
    return { text: count.toString() + '/' + maxCategories.value.toString(), class: 'text-surface-100' };
  }
};

// Fonction pour créer un template d'icône avec h()
const createIconTemplate = (IconComponent) => {
  return () => h(IconComponent, { class: 'w-4 h-4' });
};

// Menu pour les catalogues en cours
const getProgressMenuItems = (catalogue) => {
  const items = [
    {
      label: 'Éditer',
      icon: Edit,
      command: () => {
        router.push(`/catalogue/${catalogue.uuid}`);
      }
    },
    // Action activée (Étape 7)
    {
      label: 'Gérer les catégories',
      icon: FolderOpen,
      command: () => {
        router.push(`/catalogue/${catalogue.uuid}/categories`);
      }
    },
    {
      label: 'Lancer l\'analyse',
      condition: catalogue.countCategories >= 1 && catalogue.canAnalyze,
      icon: TrendingUp,
      command: () => {
        openAnalyzeDialog(catalogue);
      }
    },
    {
      label: 'Supprimer',
      icon: Trash2,
      command: () => {
        deleteCatalogue(catalogue);
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

// Menu pour les catalogues historiques
const getCompletedMenuItems = (catalogue) => {
  return [
    {
      label: 'Voir l\'analyse',
      icon: Eye,
      command: () => {
        router.push(`/catalogue/${catalogue.uuid}/analyse`);
      }
    },
    {
      label: 'Exporter les données',
      icon: FileSpreadsheet,
      command: () => {
        // Télécharger le fichier XLS depuis l'URL fournie
        downloadFile(catalogue.export_xls, 'Le fichier XLS n\'est pas disponible');
      }
    },
    {
      label: 'Télécharger l\'analyse',
      icon: FileText,
      command: () => {
        // Ouvrir le PDF dans un nouvel onglet
        if (catalogue.export_pdf?.url) {
          window.open(catalogue.export_pdf.url, '_blank');
        } else {
          toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Le fichier PDF n\'est pas disponible',
            life: 3000
          });
        }
      }
    }
  ];
};

// Fonctions de redirection pour les liens cliquables
const handleProgressTitleClick = (catalogue) => {
  router.push(`/catalogue/${catalogue.uuid}`);
};

const handleProgressCategoriesCountClick = (catalogue) => {
  // Navigation vers la gestion des catégories (Étape 7 activée)
  router.push(`/catalogue/${catalogue.uuid}/categories`);
};

const handleCompletedTitleClick = (catalogue) => {
  router.push(`/catalogue/${catalogue.uuid}/analyse`);
};

// Fonction pour ouvrir le dialog d'analyse
const openAnalyzeDialog = (catalogue) => {
  selectedCatalogue.value = catalogue;
  showAnalyzeDialog.value = true;
};

// Fonction pour fermer le dialog d'analyse
const closeAnalyzeDialog = () => {
  showAnalyzeDialog.value = false;
  selectedCatalogue.value = null;
};

// Fonction pour confirmer l'analyse
const confirmAnalyze = async () => {
  if (!selectedCatalogue.value) return;
  
  // Sauvegarder l'UUID avant de fermer le dialog
  const catalogueUuid = selectedCatalogue.value.uuid;
  
  loading.value = true;
  try {
    await catalogueService.analyzeCatalogue(catalogueUuid);
    
    toast.add({
      severity: 'success',
      summary: 'Analyse lancée',
      detail: 'L\'analyse du catalogue a été lancée avec succès',
      life: 3000
    });
    
    closeAnalyzeDialog();
    
    // Recharger les catalogues pour voir les changements
    await fetchCatalogues();
    
    // Rediriger vers la vue d'analyse
    router.push(`/catalogue/${catalogueUuid}/analyse`);
    
  } catch (error) {
    console.error('Erreur lors du lancement de l\'analyse:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.error || 'Erreur lors du lancement de l\'analyse',
      life: 5000
    });
  } finally {
    loading.value = false;
  }
};

// Équivalent à mounted dans l'option API
onMounted(() => {
  fetchCatalogues();
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
              <BookOpen class="title-icon" />
              Catalogues de véhicules
            </h1>
            <p class="page-subtitle">Gérez et analysez vos catalogues multi-catégories</p>
          </div>
        </div>

        <!-- Bouton d'action -->
        <div class="header-actions">
          <Button
              severity="primary"
              class="btn-primary"
              v-if="!loading"
              @click="router.push('/catalogue/add')"
              outlined
          >
            <Plus class="w-4 h-4 mr-2"/>
            Nouveau catalogue
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
              <div class="stat-number">{{ catalogues?.progress.length || 0 }}</div>
              <div class="stat-label">En cours</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon-completed">
              <CheckCircle2 class="w-5 h-5" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ catalogues?.completed.length || 0 }}</div>
              <div class="stat-label">Terminés</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon-total">
              <TrendingUp class="w-5 h-5" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ catalogues?.progress.length + catalogues?.completed.length }}</div>
              <div class="stat-label">Total</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <ProgressSpinner class="loading-spinner" />
          <p class="loading-text">Chargement des catalogues...</p>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="content-grid animate-slide-in-up">
        <!-- Section En cours -->
        <div class="section-card section-progress">
          <div class="section-header">
            <div class="section-title">
              <Clock class="section-icon" />
              <h2>Catalogues en cours</h2>
              <div class="section-badge section-badge-progress">
                {{ catalogues?.progress.length || 0 }}
              </div>
            </div>
          </div>

          <div class="section-content">
            <DataTableCatalogue
                :data="catalogues.progress"
                title="Catalogues en cours"
                :rows-per-page="itemPerPage"
                :count-categories-getter="getCountCategoriesStyle"
                :date-formatter="formatShortDate"
                empty-message="Aucun catalogue en cours"
                :menu-items="getProgressMenuItems"
                :on-title-click="handleProgressTitleClick"
                :on-categories-count-click="handleProgressCategoriesCountClick"
                :is-progress-section="true"
                :max-categories="maxCategories"
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
                {{ catalogues?.completed.length || 0 }}
              </div>
            </div>
          </div>

          <div class="section-content">
            <DataTableCatalogue
                :data="catalogues.completed"
                title="Historique"
                :rows-per-page="itemPerPage"
                :count-categories-getter="getCountCategoriesStyle"
                :date-formatter="formatShortDate"
                empty-message="Aucun catalogue dans l'historique"
                :menu-items="getCompletedMenuItems"
                :show-analyse-column="true"
                :show-created-column="false"
                :on-title-click="handleCompletedTitleClick"
                :is-progress-section="false"
                :max-categories="maxCategories"
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
          Une fois l'analyse lancée, plus aucune modification de ce catalogue ne pourra être effectuée.
          Souhaitez-vous continuer ?
        </p>

        <div class="p-4 bg-surface-50 dark:bg-surface-800/20 rounded-lg border border-blue-200 dark:border-surface-700">
          <div class="flex items-center gap-2 text-surface-700 dark:text-surface-300 font-medium mb-2">
            <i class="pi pi-info-circle"></i>
            <span>Prérequis pour l'analyse</span>
          </div>
          <ul class="text-sm text-surface-600 dark:text-surface-400 space-y-1">
            <li>• Au moins 1 catégorie dans le catalogue</li>
            <li>• Minimum 2 véhicules par catégorie</li>
          </ul>
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
