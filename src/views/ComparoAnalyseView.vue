<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import ProgressSpinner from 'primevue/progressspinner';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';

import { comparoService } from '@/services/api/comparoService';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const loading = ref(true);
const comparo = ref(null);

// Structure de données pour le tableau
const sectionsData = ref([]);

// Fonction pour calculer la puissance en KW
const getPuissanceKW = (puissanceCV) => {
  return Math.round(puissanceCV * 0.735);
};

// Fonction pour calculer le prix total
const getPrixTotal = (vehicule) => {
  return (vehicule.prix || 0) + (vehicule.prix_options || 0);
};

// Fonction pour calculer le prix remisé
const getPrixRemise = (vehicule) => {
  const prixTotal = getPrixTotal(vehicule);
  const remiseDecimal = (vehicule.remise || 0) / 100;
  return prixTotal * (1 - remiseDecimal);
};

// Fonction pour calculer le TCO total sur la durée du contrat
const getTCOTotal = (vehicule) => {
  return (vehicule.calcul?.tcoMensuel || 0) * (vehicule.duree || 36);
};

// Fonction pour calculer le PRK
const getPRK = (vehicule) => {
  const kmMensuel = vehicule.calcul?.km_mensuel || 0;
  const tcoMensuel = vehicule.calcul?.tcoMensuel || 0;
  return kmMensuel ? (tcoMensuel / kmMensuel) : 0;
};

// Fonction pour calculer la ventilation du TCO en pourcentage
const getTCOVentilation = (vehicule, type) => {
  const tcoMensuel = vehicule.calcul?.tcoMensuel || 0;
  if (!tcoMensuel) return 0;

  if (type === 'loyer') {
    const loyerTotal = vehicule.calcul?.loyer_total || 0;
    return Math.round((loyerTotal / tcoMensuel) * 100);
  } else if (type === 'fiscalite') {
    const fiscalite = vehicule.calcul?.fiscalite_mensuel || 0;
    return Math.round((fiscalite / tcoMensuel) * 100);
  } else if (type === 'carburant') {
    const carburant = vehicule.calcul?.budget_mensuel_total_energie || 0;
    return Math.round((carburant / tcoMensuel) * 100);
  }
  return 0;
};

// Fonction pour obtenir le TCO moyen entre tous les véhicules
const getTCOMoyen = computed(() => {
  if (!comparo.value?.vehicules?.length) return 0;

  const sum = comparo.value.vehicules.reduce((acc, vehicule) => {
    return acc + (vehicule.calcul?.tcoMensuel || 0);
  }, 0);

  return sum / comparo.value.vehicules.length;
});

// Fonction pour déterminer si une valeur est la plus basse/haute
const getMinValue = (field) => {
  if (!comparo.value?.vehicules?.length) return Infinity;

  let values = comparo.value.vehicules.map(vehicule => {
    switch (field) {
      case 'prix': return getPrixTotal(vehicule);
      case 'prix_remise': return getPrixRemise(vehicule);
      case 'loyer': return vehicule.calcul?.loyer_total || 0;
      case 'fiscalite': return vehicule.calcul?.fiscalite_mensuel || 0;
      case 'carburant': return vehicule.calcul?.budget_mensuel_total_energie || 0;
      case 'tco': return vehicule.calcul?.tcoMensuel || 0;
      case 'prk': return getPRK(vehicule);
      default: return 0;
    }
  });

  return Math.min(...values);
};

const getMaxValue = (field) => {
  if (!comparo.value?.vehicules?.length) return -Infinity;

  let values = comparo.value.vehicules.map(vehicule => {
    switch (field) {
      case 'prix': return getPrixTotal(vehicule);
      case 'prix_remise': return getPrixRemise(vehicule);
      case 'loyer': return vehicule.calcul?.loyer_total || 0;
      case 'fiscalite': return vehicule.calcul?.fiscalite_mensuel || 0;
      case 'carburant': return vehicule.calcul?.budget_mensuel_total_energie || 0;
      case 'tco': return vehicule.calcul?.tcoMensuel || 0;
      case 'prk': return getPRK(vehicule);
      default: return 0;
    }
  });

  return Math.max(...values);
};

// Fonction pour déterminer les styles conditionnels
const getCellClass = (value, field) => {
  const min = getMinValue(field);
  const max = getMaxValue(field);

  if (value === min) return 'text-green-400';
  if (value === max) return 'text-orange-400';
  return '';
};

// Fonction pour formater les valeurs monétaires
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

// Fonction pour formater les pourcentages
const formatPercent = (value) => {
  if (value === undefined || value === null) return '';
  return `${value}%`;
};

// Fonction pour formater les valeurs décimales
const formatNumber = (value, decimals = 2) => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: decimals }).format(value);
};

// Préparation des données pour le DataTable
const prepareTableData = () => {
  if (!comparo.value?.vehicules?.length) return;

  const sections = [
    {
      id: 'infos_vehicule',
      title: 'Infos véhicule',
      rows: [
        { id: 'loueur', name: 'Loueur', getValue: (v) => v.loueur?.name || '' },
        { id: 'marque', name: 'Marque', getValue: (v) => v.marque?.name || '' },
        { id: 'modele', name: 'Modèle', getValue: (v) => v.modele?.title || '' },
        { id: 'finition', name: 'Finition', getValue: (v) => v.finition || '' },
        {id: 'type_fisc', name: 'Type fiscal', getValue: (v) => v.type_fisc?.toUpperCase() || ''},
        { id: 'energie', name: 'Carburant', getValue: (v) => v.energie?.toUpperCase() || '' },
        { id: 'puissance', name: 'Puissance', getValue: (v) => v.puissance ? `${v.puissance} ch` : '' },
        { id: 'puissance_kw', name: 'Puissance KW', getValue: (v) => getPuissanceKW(v.puissance) ? `${getPuissanceKW(v.puissance)} kW` : '' },
        { id: 'conso_carb', name: 'Consommation carburant', getValue: (v) => v.conso_carb ? `${formatNumber(v.conso_carb, 1)} L/100km` : '' },
        { id: 'conso_kwh', name: 'Consommation kwh', getValue: (v) => v.conso_kwh ? `${formatNumber(v.conso_kwh, 1)} kWh/100km` : '' },
        { id: 'co2', name: 'Émission CO2 WLTP', getValue: (v) => v.co2 ? `${v.co2} g/km` : '' },
        { id: 'prix', name: 'Prix du véhicule non remisé', getValue: (v) => formatCurrency(v.prix) },
        { id: 'prix_options', name: 'Montant option(s) non remisé', getValue: (v) => formatCurrency(v.prix_options) },
        { id: 'accessoires', name: 'Total accessoires', getValue: (v) => formatCurrency(0) },
        { id: 'prix_total', name: 'Prix total avec options',
          getValue: (v) => formatCurrency(getPrixTotal(v)),
          field: 'prix',
          getClass: (v) => getCellClass(getPrixTotal(v), 'prix') },
        { id: 'remise', name: 'Remise en %', getValue: (v) => formatPercent(v.remise) },
        { id: 'prix_remise', name: 'Prix remisé TTC',
          getValue: (v) => formatCurrency(getPrixRemise(v)),
          field: 'prix_remise',
          getClass: (v) => getCellClass(getPrixRemise(v), 'prix_remise') }
      ]
    },
    {
      id: 'contrat',
      title: 'Contrat',
      rows: [
        { id: 'loyer_total', name: 'Loyer total',
          getValue: (v) => formatCurrency(v.calcul?.loyer_total),
          field: 'loyer',
          getClass: (v) => getCellClass(v.calcul?.loyer_total, 'loyer') }
      ]
    },
    {
      id: 'fiscalite',
      title: 'Fiscalité',
      rows: [
        { id: 'fiscalite_mensuelle', name: 'Fiscalité mensuelle',
          getValue: (v) => formatCurrency(v.calcul?.fiscalite_mensuel),
          field: 'fiscalite',
          getClass: (v) => getCellClass(v.calcul?.fiscalite_mensuel, 'fiscalite') }
      ]
    },
    {
      id: 'energie',
      title: 'Énergie',
      rows: [
        { id: 'carburant_mensuel', name: 'Carburant mensuel',
          getValue: (v) => formatCurrency(v.calcul?.budget_mensuel_total_energie),
          field: 'carburant',
          getClass: (v) => getCellClass(v.calcul?.budget_mensuel_total_energie, 'carburant') }
      ]
    },
    {
      id: 'tco',
      title: 'TCO',
      rows: [
        { id: 'tco_mensuel', name: 'TCO mensuel',
          getValue: (v) => formatCurrency(v.calcul?.tcoMensuel),
          field: 'tco',
          getClass: (v) => getCellClass(v.calcul?.tcoMensuel, 'tco') },
        { id: 'tco_moyen', name: 'TCO Moyen mensuel', getValue: () => formatCurrency(getTCOMoyen.value) },
        { id: 'prk', name: 'PRK /km',
          getValue: (v) => formatCurrency(getPRK(v)),
          field: 'prk',
          getClass: (v) => getCellClass(getPRK(v), 'prk') },
        { id: 'tco_total', name: 'TCO Total (durée du contrat)', getValue: (v) => formatCurrency(getTCOTotal(v)) }
      ]
    },
    {
      id: 'ventilation_tco',
      title: 'Ventilation TCO',
      rows: [
        { id: 'tco_loyer', name: 'Loyer et services (en %)', getValue: (v) => formatPercent(getTCOVentilation(v, 'loyer')) },
        { id: 'tco_fiscalite', name: 'Fiscalité (en %)', getValue: (v) => formatPercent(getTCOVentilation(v, 'fiscalite')) },
        { id: 'tco_carburant', name: 'Carburant (en %)', getValue: (v) => formatPercent(getTCOVentilation(v, 'carburant')) }
      ]
    }
  ];

  // Structurer les données pour le DataTable
  const tableData = [];

  sections.forEach(section => {
    // Ajouter l'en-tête de section en tant que ligne de groupe
    tableData.push({
      id: `section_${section.id}`,
      type: 'header',
      label: section.title
    });

    // Ajouter les lignes
    section.rows.forEach(row => {
      const rowData = {
        id: row.id,
        type: 'data',
        label: row.name,
        field: row.field || null,
      };

      // Ajouter une colonne pour chaque véhicule
      comparo.value.vehicules.forEach((vehicule, index) => {
        rowData[`vehicule_${index}`] = {
          value: row.getValue(vehicule),
          class: row.getClass ? row.getClass(vehicule) : ''
        };
      });

      tableData.push(rowData);
    });
  });

  sectionsData.value = tableData;
};

// Fonction pour télécharger un fichier depuis une URL
const downloadFile = (url, filename) => {
  if (!url) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'URL de téléchargement indisponible',
      life: 3000
    });
    return;
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'document';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Fonction pour télécharger le PDF d'analyse
const downloadPDF = () => {
  if (comparo.value?.export_pdf?.url) {
    downloadFile(comparo.value.export_pdf.url, comparo.value.export_pdf.filename);
  } else {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'PDF d\'analyse non disponible',
      life: 3000
    });
  }
};

// Fonction pour exporter les données au format Excel
const downloadExcel = () => {
  if (comparo.value?.export_xls?.url) {
    downloadFile(comparo.value.export_xls.url, comparo.value.export_xls.filename);
  } else {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Export Excel non disponible',
      life: 3000
    });
  }
};

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
    const response = await comparoService.getComparoAnalyseByUuid(uuid);
    comparo.value = response.data;
    prepareTableData();
    console.log('Véhicules du comparo:', response.data?.vehicules);
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

onMounted(() => {
  loadComparoData();
});
</script>

<template>
  <div class="gap-3 w-full flex justify-center">
    <div class="w-full max-w-[1200px] flex flex-1 flex-col my-8">
      <div v-if="loading" class="flex justify-center items-center py-8">
        <ProgressSpinner />
      </div>

      <div v-else-if="comparo" class="w-full flex flex-1 flex-col">
        <div class="w-full justify-between flex flex-row mb-6">
          <h1 class="text-xl sm:text-2xl font-bold">Analyse du comparo</h1>
        </div>

        <Card class="shadow-sm mb-6">
          <template #title>
            <div class="flex items-center gap-2 text-primary">
              <h2 class="text-md font-semibold">{{ comparo.title }}</h2>
            </div>
          </template>
          <template #content>
            <div class="p-4">
              <!-- Tableau comparatif avec PrimeVue DataTable -->
              <DataTable
                :value="sectionsData"
                class="comparison-table"
                scrollable
                scrollHeight="flex"
                responsiveLayout="scroll"
                tableStyle="min-width: 50rem"
                size="small"
                groupRowsBy="type"
              >
                <!-- En-tête personnalisé avec les titres de véhicules -->
                <ColumnGroup type="header">
                  <Row>
                    <Column :frozen="true" style="width: 300px; min-width: 300px" />
                    <Column
                      v-for="(vehicule, index) in comparo.vehicules"
                      :key="'header_'+vehicule.id"
                      :header="`${vehicule?.marque?.name} ${vehicule?.modele?.title}`"
                    />
                  </Row>
                </ColumnGroup>

                <!-- Colonne pour le nom des propriétés -->
                <Column
                  field="label"

                  style="width: 300px; min-width: 300px"
                  headerStyle="display: none"
                >
                  <template #body="{ data }">
                    <div
                      :class="{
                        'font-semibold': data.type === 'data',
                        'font-bold text-md pt-6 text-primary': data.type === 'header'
                      }"
                    >
                      {{ data.label }}
                    </div>
                  </template>
                </Column>

                <!-- Colonne dynamique pour chaque véhicule -->
                <Column
                  v-for="(vehicule, index) in comparo.vehicules"
                  :key="'value_'+vehicule.id"
                  :field="`vehicule_${index}.value`"
                  headerStyle="display: none"
                >
                  <template #body="{ data, column }">
                    <!-- Si c'est un en-tête de section, n'affiche rien car nous utilisons le template de rowgroup -->
                    <div
                      v-if="data.type === 'data'"
                      class="text-left"
                      :class="data[`vehicule_${index}`]?.class || ''"
                    >
                      {{ data[`vehicule_${index}`]?.value }}
                    </div>
                  </template>
                </Column>

                <!-- Template personnalisé pour les en-têtes de section -->
                <template #rowgroupheader="{ data, index }">
                  <td v-if="data.type === 'header'" :colspan="comparo.vehicules.length + 1" class="section-header py-2 px-4">
                    <div class="font-bold text-md">{{ data.label }}</div>
                  </td>
                </template>
              </DataTable>
            </div>
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
          <div class="flex gap-2">
            <Button
              severity="success"
              @click="downloadExcel"
              class="w-[200px] min-w-[200px]"
            >
              Exporter les données
            </Button>
            <Button
              severity="info"
              @click="downloadPDF"
              class="w-[200px] min-w-[200px]"
            >
              Télécharger l'analyse
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Style pour le DataTable */
:deep(.comparison-table) {
  /* Supprime les bordures multiples */
  border-collapse: collapse;
}

:deep(.p-datatable-wrapper) {
  overflow-x: auto;
}

:deep(.p-datatable-scrollable-body) {
  overflow-y: visible;
}

:deep(.p-datatable-tbody tr[data-type="header"] td) {
  font-weight: bold;
  font-size: 1.125rem;
  padding: 0.5rem 1rem;
}

:deep(.p-frozen-column) {
  z-index: 1;
  font-weight: 600;
}

/* Style pour les lignes d'en-tête */
:deep(.p-datatable-tbody > tr[data-type="header"]) {
  font-weight: bold;
}

/* Style pour les en-têtes de section */
:deep(.section-header) {
  background-color: var(--surface-100);
  text-align: left;
  border-bottom: 1px solid var(--surface-200);
  border-top: 1px solid var(--surface-200);
}

/* Alignement à gauche pour toutes les cellules de données */
:deep(.p-datatable .p-datatable-tbody > tr > td) {
  text-align: left;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  text-align: left;
}

/* Ajustement responsive */
@media (max-width: 768px) {
  :deep(.p-datatable-scrollable-body) {
    overflow-x: auto;
  }

  :deep(.p-frozen-column) {
  }
}
</style>
