<script setup>
import {ref, onMounted, computed, h} from 'vue';
import ProgressSpinner from 'primevue/progressspinner';
import {useStore} from 'vuex'
import Card from 'primevue/card'
import ComparoDataTable from '@/components/ui/DataTableComparo.vue'
import {useRouter} from 'vue-router'
import {Edit, Trash2, Eye, FileSpreadsheet, FileText, Car, Plus} from 'lucide-vue-next';
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

const maxVehicule = computed(() => store.state.auth.tokenInfo.drupal?.nbMaxVehicules ?? 3)
const maxComparos = computed(() => store.state.auth.tokenInfo.drupal?.nbMaxComparos ?? 3)

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
  return [
    {
      label: 'Éditer',
      icon: Edit,
      command: () => {
        // TODO: Remplacer par la route d'édition
        router.push('/');
      }
    },
    {
      label: 'Gérer les véhicules',
      icon: Car,
      command: () => {
        // TODO: Remplacer par la route d'édition
        router.push('/');
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
        // TODO: Remplacer par la route d'analyse
        router.push('/');
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
  <div class="gap-3 w-full flex justify-center">
    <div class="w-full max-w-[1200px] flex flex-1 flex-col my-8">
      <div class="w-full justify-between flex flex-row">
        <h1 class="text-xl sm:text-2xl font-bold pb-6">Comparos
          <span v-if="maxComparos !== -1" class="ml-2 text-3xl">{{ comparos?.progress.length + comparos?.completed.length }}/{{
              maxComparos
            }}</span>
        </h1>
        <Button
            type="button"
            severity="primary"
            class="mb-6"
            size="medium"
            v-if="comparos?.progress.length + comparos?.completed.length < maxComparos || maxComparos === -1"
        >
          <Plus class="h-4 w-4 mr-2"/>
          Créer un comparo
        </Button>
      </div>
      <div v-if="loading" class="flex justify-center items-center py-8">
        <ProgressSpinner/>
      </div>

      <div v-else class="comparos-list grid gap-4">
        <Card class="shadow-sm mb-4">
          <template #title>
            <div class="flex items-center gap-2 text-primary mb-4">
              <h2>En cours</h2>
            </div>
          </template>

          <template #content>
            <ComparoDataTable
                :data="comparos.progress"
                title="Comparos en cours"
                :rows-per-page="itemPerPage"
                :count-vehicule-getter="getCountVehiculeStyle"
                :date-formatter="formatShortDate"
                empty-message="Aucun comparo en cours"
                :menu-items="getProgressMenuItems"
            />
          </template>
        </Card>

        <Card class="shadow-sm mb-4">
          <template #title>
            <div class="flex items-center gap-2 text-primary mb-4">
              <h2>Historique</h2>
            </div>
          </template>

          <template #content>
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
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles pour les icônes si nécessaire */
:deep(.p-menuitem-icon) {
  margin-right: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
