<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Menu from 'primevue/menu';
import ProgressSpinner from 'primevue/progressspinner';
import { MoreVertical, Edit, Trash2, Plus, FolderOpen, Car, TrendingUp } from 'lucide-vue-next';

import { catalogueService } from '@/services/api/catalogueService';

const store = useStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

const loading = ref(false);
const catalogue = ref(null);
const menu = ref();
const selectedCategorie = ref(null);

const maxCategories = computed(() => {
  // Maximum 5 catégories par catalogue (en dur comme demandé)
  return 5;
});

const canAddCategorie = computed(() => {
  if (!catalogue.value?.categories) return false;
  return catalogue.value.categories.length < maxCategories.value;
});

const canAnalyze = computed(() => {
  if (!catalogue.value?.categories) return false;
  // Minimum 2 catégories et chaque catégorie doit avoir au moins 2 véhicules
  const hasEnoughCategories = catalogue.value.categories.length >= 2;
  const allCategoriesHaveEnoughVehicules = catalogue.value.categories.every(
    categorie => categorie.countVehicules >= 2
  );
  return hasEnoughCategories && allCategoriesHaveEnoughVehicules;
});

const loadCatalogueData = async () => {
  const uuid = route.params.uuid;
  if (!uuid) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Identifiant du catalogue manquant',
      life: 3000
    });
    router.push('/catalogues');
    return;
  }

  loading.value = true;
  try {
    const response = await catalogueService.getCatalogueByUuid(uuid);
    catalogue.value = response.data;

    // Si le catalogue a déjà été analysé, rediriger vers la liste
    if (catalogue.value.export_pdf) {
      toast.add({
        severity: 'warn',
        summary: 'Catalogue analysé',
        detail: 'Ce catalogue a déjà été analysé et ne peut plus être modifié',
        life: 5000
      });
      router.push('/catalogues');
    }
  } catch (error) {
    console.error('Erreur lors du chargement du catalogue:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur de chargement',
      detail: 'Impossible de charger les données du catalogue',
      life: 3000
    });
    router.push('/catalogues');
  } finally {
    loading.value = false;
  }
};

const showMenu = (event, categorie) => {
  selectedCategorie.value = categorie;
  menu.value.toggle(event);
};

const menuItems = computed(() => {
  if (!selectedCategorie.value) return [];

  return [
    // Actions activées (Étapes 7-8)
    {
      label: 'Éditer',
      icon: Edit,
      command: () => {
        router.push(`/catalogue/${catalogue.value.uuid}/categories/${selectedCategorie.value.uuid}`);
      }
    },
    {
      label: 'Gérer les véhicules',
      icon: Car,
      command: () => {
        router.push(`/catalogue/${catalogue.value.uuid}/categories/${selectedCategorie.value.uuid}/vehicules`);
      }
    },
    {
      label: 'Supprimer',
      icon: Trash2,
      command: () => {
        deleteCategorie(selectedCategorie.value);
      }
    }
  ];
});

const deleteCategorie = (categorie) => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir supprimer cette catégorie ?',
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      loading.value = true;
      try {
        await catalogueService.deleteCategorieByUuid(catalogue.value.uuid, categorie.uuid);
        toast.add({
          severity: 'success',
          summary: 'Catégorie supprimée',
          detail: 'La catégorie a été supprimée avec succès',
          life: 3000
        });
        // Recharger les données du catalogue
        loadCatalogueData();
      } catch (error) {
        console.error('Erreur lors de la suppression de la catégorie:', error);
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer cette catégorie',
          life: 3000
        });
      } finally {
        loading.value = false;
      }
    }
  });
};

const deleteCatalogue = () => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir supprimer ce catalogue ?',
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      loading.value = true;
      try {
        await catalogueService.deleteCatalogueByUuid(catalogue.value.uuid);
        toast.add({
          severity: 'success',
          summary: 'Catalogue supprimé',
          detail: 'Le catalogue a été supprimé avec succès',
          life: 3000
        });
        router.push('/catalogues');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer le catalogue',
          life: 3000
        });
      } finally {
        loading.value = false;
      }
    }
  });
};

const analyzeCatalogue = () => {
  // Vérification des prérequis d'analyse
  const categoriesCount = catalogue.value.categories?.length || 0;
  
  // Vérifier minimum 2 catégories
  if (categoriesCount < 2) {
    toast.add({
      severity: 'warn',
      summary: 'Analyse impossible',
      detail: `Il faut au minimum 2 catégories pour lancer l'analyse. Actuellement : ${categoriesCount} catégorie${categoriesCount > 1 ? 's' : ''}`,
      life: 5000
    });
    return;
  }
  
  // Vérifier minimum 2 véhicules par catégorie
  const categoriesWithInsufficientVehicles = catalogue.value.categories.filter(cat => cat.countVehicules < 2);
  if (categoriesWithInsufficientVehicles.length > 0) {
    const categoryNames = categoriesWithInsufficientVehicles.map(cat => `"${cat.title}" (${cat.countVehicules} véhicule${cat.countVehicules > 1 ? 's' : ''})`).join(', ');
    toast.add({
      severity: 'warn',
      summary: 'Analyse impossible',
      detail: `Chaque catégorie doit avoir au minimum 2 véhicules. Catégories insuffisantes : ${categoryNames}`,
      life: 7000
    });
    return;
  }
  
  // Si toutes les conditions sont remplies, lancer l'analyse
  // TODO: Étapes 9 - Implémenter l'analyse
  toast.add({
    severity: 'info',
    summary: 'Analyse en cours de développement',
    detail: 'La fonctionnalité d\'analyse sera disponible prochainement',
    life: 3000
  });
};

const getVehiculeCountStyle = (count) => {
  if (count === 0) {
    return 'text-red-500';
  } else if (count >= 2) {
    return 'text-green-500';
  } else {
    return 'text-orange-500';
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
              <FolderOpen class="title-icon" />
              Catégories
              <span v-if="catalogue && maxCategories !== -1" class="ml-2 text-3xl">{{ catalogue.categories?.length || 0 }}/{{ maxCategories }}</span>
            </h1>
            <p class="page-subtitle">Gérez les catégories de votre catalogue</p>
          </div>
        </div>

      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <ProgressSpinner class="loading-spinner" />
          <p class="loading-text">Chargement des catégories...</p>
        </div>
      </div>

      <!-- Contenu principal -->
      <div v-else-if="catalogue" class="content-grid animate-slide-in-up">
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <FolderOpen class="section-icon" />
              <h2>{{ catalogue.title }}</h2>
            </div>
          </div>
          
          <div class="section-content">
            <div class="p-6">
              <div v-if="catalogue.description" class="mb-4">
                <p class="text-surface-200 font-inter">{{ catalogue.description }}</p>
              </div>


              <DataTable
                  :value="catalogue.categories"
                  responsiveLayout="scroll"
                  :scrollable="true"
                  class="p-datatable-sm"
              >
                <Column field="title" header="Titre" sortable>
                  <template #body="slotProps">
                    <button 
                        @click="router.push(`/catalogue/${catalogue.uuid}/categories/${slotProps.data.uuid}`)"
                        class="text-primary-600 hover:text-primary-700 font-medium cursor-pointer underline-offset-2 hover:underline"
                    >
                      {{ slotProps.data.title }}
                    </button>
                  </template>
                </Column>
                <Column field="km" header="Kilométrage" sortable>
                  <template #body="slotProps">
                    {{ slotProps.data.km?.toLocaleString() }} km
                  </template>
                </Column>
                <Column field="duree" header="Durée (mois)" sortable></Column>
                <Column field="countVehicules" header="Véhicules" sortable>
                  <template #body="slotProps">
                    <button 
                        @click="router.push(`/catalogue/${catalogue.uuid}/categories/${slotProps.data.uuid}/vehicules`)"
                        :class="[getVehiculeCountStyle(slotProps.data.countVehicules), 'cursor-pointer hover:underline underline-offset-2 font-medium']"
                    >
                      {{ slotProps.data.countVehicules }}
                    </button>
                  </template>
                </Column>
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
                    Aucune catégorie dans ce catalogue
                  </div>
                </template>

                <template #footer>
                  <tr>
                    <td :colspan="5" class="text-center py-4">
                      <!-- TODO: Étapes 7-8 - Bouton temporairement désactivé -->
                      <Button
                          v-if="canAddCategorie"
                          severity="secondary"
                          outlined
                          class="mx-auto btn-primary"
                          @click="router.push(`/catalogue/${catalogue.uuid}/categories/add`)"
                      >
                        <Plus class="w-4 h-4 mr-2"/>
                        <span>Ajouter une catégorie</span>
                      </Button>
                      <p v-else class="text-surface-200 font-inter font-medium">
                        Nombre maximum de catégories atteint ({{ maxCategories }})
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
                    @click="router.push('/catalogues')"
                    class="btn-primary w-[200px] min-w-[200px]"
                >
                  Retour Catalogues
                </Button>

                <Button
                    severity="danger"
                    outlined
                    @click="deleteCatalogue"
                    class="btn-primary"
                >
                  <Trash2 class="w-4 h-4 mr-2"/>
                  Supprimer le catalogue
                </Button>

                <Button
                    severity="primary"
                    @click="analyzeCatalogue"
                    class="btn-primary"
                >
                  <TrendingUp class="w-4 h-4 mr-2"/>
                  Analyser ce catalogue
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.5rem 1rem;
}
</style>