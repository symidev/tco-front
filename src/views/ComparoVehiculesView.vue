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
import {MoreVertical, Edit, Trash2, Plus} from 'lucide-vue-next';

import {comparoService} from '@/services/api/comparoService';

const store = useStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

const loading = ref(false);
const comparo = ref(null);
const menu = ref();
const selectedVehicule = ref(null);

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

const analyzeComparo = () => {
  confirm.require({
    message: 'Une fois l\'analyse lancée, plus aucune modification de ce comparo ne pourra être effectuée. Souhaitez-vous continuer ?',
    header: 'Confirmation d\'analyse',
    icon: 'pi pi-info-circle',
    acceptLabel: 'Oui, lancer l\'analyse',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-primary',
    accept: () => {
      // TODO: Implémenter l'analyse du comparo
      console.log('Lancer l\'analyse du comparo:', comparo.value.uuid);
      toast.add({
        severity: 'success',
        summary: 'Analyse lancée',
        detail: 'L\'analyse du comparo a été lancée avec succès',
        life: 3000
      });
      router.push('/comparos');
    }
  });
};

onMounted(() => {
  loadComparoData();
});
</script>

<template>
  <div class="gap-3 w-full flex justify-center">
    <div class="w-full max-w-[1200px] flex flex-1 flex-col my-8">
      <div v-if="loading" class="flex justify-center items-center py-8">
        <ProgressSpinner/>
      </div>

      <div v-else-if="comparo" class="w-full flex flex-1 flex-col">
        <div class="w-full justify-between flex flex-row mb-6">
          <h1 class="text-xl sm:text-2xl font-bold">Véhicules
            <span v-if="maxVehicule !== -1" class="ml-2 text-3xl">{{ comparo.vehicules.length }}/{{
                maxVehicule
              }}</span>
          </h1>
          <Button
              v-if="canAddVehicule"
              severity="primary"
              size="medium"
              @click="router.push(`/comparo/${comparo.uuid}/vehicules/add`)"
          >
            <Plus class="w-4 h-4 mr-2"/>
            Ajouter un véhicule
          </Button>
        </div>

        <Card class="shadow-sm mb-6">
          <template #title>
            <div class="flex items-center gap-2 text-primary">
              <h2 class="text-lg font-semibold">{{ comparo.title }}</h2>
            </div>
          </template>
          <template #subtitle v-if="comparo.description">
            <div class="mb-4">
              <p class="text-gray-500">{{ comparo.description }}</p>
            </div>
          </template>
          <template #content>
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
                <div class="p-4 text-center text-gray-500">
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
                        class="mx-auto text-primary"
                        @click="router.push(`/comparo/${comparo.uuid}/vehicules/add`)"
                    >
                      <Plus class="w-4 h-4 mr-2"/>
                      <span class="text-primary">Ajouter un véhicule</span>
                    </Button>
                    <p v-else class="text-gray-500">
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
                  <span class="p-menuitem-text">{{ item.label }}</span>
                </a>
              </template>
            </Menu>
          </template>
        </Card>

        <div class="flex flex-row flex-wrap items-center justify-center sm:justify-between gap-4">
          <Button
              type="button"
              outlined
              @click="router.push(`/comparos`)"
              class="w-[200px] min-w-[200px]"
          >
            Retour Comparos
          </Button>

          <Button
              severity="danger"
              outlined
              @click="deleteComparo"
          >
            <Trash2 class="w-4 h-4 mr-2"/>
            Supprimer le comparo
          </Button>

          <Button
              severity="primary"
              :disabled="!canAnalyze"
              @click="analyzeComparo"
          >
            Analyser ce comparo
          </Button>
        </div>

        <div class="flex justify-between mt-4">
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
