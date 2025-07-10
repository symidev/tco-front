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
import {MoreVertical, Edit, Trash2, Plus, Car, FolderOpen} from 'lucide-vue-next';

import {catalogueService} from '@/services/api/catalogueService';

const store = useStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

const loading = ref(false);
const catalogue = ref(null);
const categorie = ref(null);
const vehicules = ref([]);
const menu = ref();
const selectedVehicule = ref(null);

const maxVehicule = computed(() => {
  if (store.state.auth?.tokenInfo?.drupal && store.state.auth?.tokenInfo?.drupal?.nbMaxVehicules) {
    return store.state.auth.tokenInfo.drupal?.nbMaxVehicules ?? 20;
  }
  return 20;
});

const canAddVehicule = computed(() => {
  return vehicules.value.length < maxVehicule.value;
});

const loadCategorieData = async () => {
  const catalogueUuid = route.params.catalogueUuid;
  const categorieUuid = route.params.categorieUuid;
  
  if (!catalogueUuid || !categorieUuid) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Identifiants manquants',
      life: 3000
    });
    router.push('/catalogues');
    return;
  }

  loading.value = true;
  try {
    // Charger les données du catalogue
    const catalogueResponse = await catalogueService.getCatalogueByUuid(catalogueUuid);
    catalogue.value = catalogueResponse.data;

    // Charger les données de la catégorie
    const categorieResponse = await catalogueService.getCategorieByUuid(catalogueUuid, categorieUuid);
    categorie.value = categorieResponse.data;

    // Charger les véhicules de la catégorie
    const vehiculesResponse = await catalogueService.getVehiculesByCategorieUuid(catalogueUuid, categorieUuid);
    vehicules.value = vehiculesResponse.data || [];

  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur de chargement',
      detail: 'Impossible de charger les données de la catégorie',
      life: 3000
    });
    router.push('/catalogues');
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
        router.push(`/catalogue/${catalogue.value.uuid}/categories/${categorie.value.uuid}/vehicules/${selectedVehicule.value.uuid}`);
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
        await catalogueService.deleteVehiculeByUuid(catalogue.value.uuid, categorie.value.uuid, vehicule.uuid);
        toast.add({
          severity: 'success',
          summary: 'Véhicule supprimé',
          detail: 'Le véhicule a été supprimé avec succès',
          life: 3000
        });
        // Recharger les données
        loadCategorieData();
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

const deleteCategorie = () => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir supprimer cette catégorie ? Tous les véhicules qu\'elle contient seront également supprimés.',
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      loading.value = true;
      try {
        await catalogueService.deleteCategorieByUuid(catalogue.value.uuid, categorie.value.uuid);
        toast.add({
          severity: 'success',
          summary: 'Catégorie supprimée',
          detail: 'La catégorie a été supprimée avec succès',
          life: 3000
        });
        router.push(`/catalogue/${catalogue.value.uuid}`);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer la catégorie',
          life: 3000
        });
      } finally {
        loading.value = false;
      }
    }
  });
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
              <Car class="title-icon" />
              Véhicules
              <span v-if="categorie && maxVehicule !== -1" class="ml-2 text-3xl">{{ vehicules.length || 0 }}/{{ maxVehicule }}</span>
            </h1>
            <p class="page-subtitle">Gérez les véhicules de votre catégorie</p>
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
      <div v-else-if="catalogue && categorie" class="content-grid animate-slide-in-up">
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <FolderOpen class="section-icon" />
              <h2>{{ categorie.title }}</h2>
            </div>
          </div>
          
          <div class="section-content">
            <div class="p-6">
              <div class="mb-4">
                <p class="text-surface-200 font-inter text-sm mb-2">
                  <strong>Catalogue :</strong> {{ catalogue.title }}
                </p>
                <p v-if="categorie.description" class="text-surface-200 font-inter">
                  {{ categorie.description }}
                </p>
              </div>
              
              <DataTable
                  :value="vehicules"
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
                    Aucun véhicule dans cette catégorie
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
                          @click="router.push(`/catalogue/${catalogue.uuid}/categories/${categorie.uuid}/vehicules/add`)"
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
                    @click="router.push(`/catalogue/${catalogue.uuid}/categories`)"
                    class="btn-primary w-[200px] min-w-[200px]"
                >
                  Retour Catégories
                </Button>

                <Button
                    severity="danger"
                    outlined
                    @click="deleteCategorie"
                    class="btn-primary"
                >
                  <Trash2 class="w-4 h-4 mr-2"/>
                  Supprimer la catégorie
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