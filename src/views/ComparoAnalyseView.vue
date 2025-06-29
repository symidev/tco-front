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
import Panel from 'primevue/panel';
import Badge from 'primevue/badge';

import { comparoService } from '@/services/api/comparoService';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const loading = ref(true);
const comparo = ref(null);
const expandedSections = ref(new Set(['infos_vehicule', 'contrat', 'fiscalite', 'energie', 'tco', 'ventilation_tco']));

// Structure de données pour le tableau
const sectionsData = ref([]);
const sectionsConfig = ref([]);

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

// Fonction pour basculer l'état d'expansion d'une section
const toggleSection = (sectionId) => {
  if (expandedSections.value.has(sectionId)) {
    expandedSections.value.delete(sectionId);
  } else {
    expandedSections.value.add(sectionId);
  }
  expandedSections.value = new Set(expandedSections.value);
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

  sectionsConfig.value = sections;

  // Créer les données pour chaque section séparément
  const sectionDataMap = {};

  sections.forEach(section => {
    const sectionData = [];

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

      sectionData.push(rowData);
    });

    sectionDataMap[section.id] = sectionData;
  });

  sectionsData.value = sectionDataMap;
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

        <!-- En-tête avec badges des véhicules -->
        <Card class="shadow-lg mb-6 border-0 rounded-lg card-no-overflow">
          <template #title>
            <div class="flex items-center justify-between bg-surface-900 text-white p-6 -m-6 mb-6">
              <div class="flex items-center gap-3">
                <h2 class="text-xl font-bold">{{ comparo.title }}</h2>
              </div>
            </div>
          </template>
          <template #content>
            <div class="space-y-1 content-no-overflow">
              <!-- Tableau d'en-tête avec les véhicules - Sticky Header -->
              <div class="sticky-header-container">
                <div class="header-sticky bg-white border-b border-gray-200 shadow-lg mb-4 rounded-t-lg">
                  <div class="header-grid gap-0" :style="`--total-columns: ${comparo.vehicules.length + 1}`">
                    <div class="header-criteria bg-surface-900 p-4 font-semibold text-white border-r border-gray-200">
                      Critères de comparaison
                    </div>
                    <div
                      v-for="(vehicule, index) in comparo.vehicules"
                      :key="'header_'+vehicule.id"
                      class="bg-surface-900 text-center p-4 border-r border-gray-200 last:border-r-0 hover:bg-surface-800 transition-all duration-300"
                    >
                      <div class="font-bold text-white text-sm">{{ vehicule?.marque?.name }}</div>
                      <div class="text-xs text-gray-300 mt-1">{{ vehicule?.modele?.title }}</div>
                      <div class="text-xs text-blue-400 font-medium mt-1">{{ vehicule?.finition }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sections repliables -->
              <div class="space-y-4 sections-container">
                <Panel
                  v-for="section in sectionsConfig"
                  :key="section.id"
                  :collapsed="!expandedSections.has(section.id)"
                  @toggle="toggleSection(section.id)"
                  class="section-panel border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                  :toggleable="true"
                >
                  <template #header>
                    <div class="flex items-center gap-3 w-full">
                      <span class="font-bold text-white">{{ section.title }}</span>
                    </div>
                  </template>

                  <div v-if="expandedSections.has(section.id)" class="overflow-hidden">
                    <DataTable
                      :value="sectionsData[section.id]"
                      class="comparison-table-section"
                      size="small"
                      :showHeaders="false"
                      stripedRows
                      :rowHover="true"
                      :style="`--total-columns: ${comparo.vehicules.length + 1}`"
                    >
                      <!-- Colonne pour le nom des propriétés -->
                      <Column
                        field="label"
                        class="property-column"
                      >
                        <template #body="{ data }">
                          <div class="font-medium text-white py-2">
                            {{ data.label }}
                          </div>
                        </template>
                      </Column>

                      <!-- Colonne dynamique pour chaque véhicule -->
                      <Column
                        v-for="(vehicule, index) in comparo.vehicules"
                        :key="'value_'+vehicule.id+section.id"
                        :field="`vehicule_${index}.value`"
                        class="value-column"
                      >
                        <template #body="{ data }">
                          <div
                            class="text-center py-2 font-medium transition-all duration-200 rounded px-2"
                            :class="[
                              data[`vehicule_${index}`]?.class || ''
                            ]"
                          >
                            {{ data[`vehicule_${index}`]?.value }}
                          </div>
                        </template>
                      </Column>
                    </DataTable>
                  </div>
                </Panel>
              </div>
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
/* Animations et transitions */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Style pour les panneaux de section */
:deep(.section-panel) {
  animation: slideIn 0.3s ease-out;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.section-panel:hover) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Style pour les DataTables des sections */
:deep(.comparison-table-section) {
  border-collapse: collapse;
  border-radius: 0px;
  overflow: hidden;
  table-layout: fixed;
  width: 100%;
}

:deep(.comparison-table-section .p-datatable-wrapper) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.comparison-table-section .p-datatable-table) {
  table-layout: fixed;
  width: 100%;
}

:deep(.comparison-table-section .property-column) {
  width: calc(100% / var(--total-columns)) !important;
}

:deep(.comparison-table-section .value-column) {
  width: calc(100% / var(--total-columns)) !important;
}

:deep(.comparison-table-section .p-datatable-tbody > tr) {
  transition: all 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

:deep(.comparison-table-section .p-datatable-tbody > tr:last-child) {
  border-bottom: none;
}

:deep(.comparison-table-section .p-datatable-tbody > tr:hover) {
  background-color: #f3f4f6 !important;
}

:deep(.comparison-table-section .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #f9fafb;
}

:deep(.comparison-table-section .p-datatable-tbody > tr:nth-child(even):hover) {
  background-color: #f1f5f9 !important;
}

/* Style pour les cellules */
:deep(.comparison-table-section .p-datatable-tbody > tr > td) {
  padding: 12px 16px;
  border-right: 1px solid #e5e7eb;
  vertical-align: middle;
}

:deep(.comparison-table-section .p-datatable-tbody > tr > td:last-child) {
  border-right: none;
}

/* Style pour la colonne des propriétés */
:deep(.property-column) {
  background-color: var(--surface-900) !important;
  font-weight: 600;
  color: white;
  border-right: 2px solid #e5e7eb !important;
}

/* Style pour les cellules de valeurs avec mise en évidence */
:deep(.value-column .text-green-400) {
  color: #10b981 !important;
  font-weight: 700;
  position: relative;
}

:deep(.value-column .text-orange-400) {
  color: #f59e0b !important;
  font-weight: 700;
  position: relative;
}

/* Icônes pour les meilleures/pires valeurs */
:deep(.text-green-400::before) {
  content: '▼';
  color: #10b981;
  font-size: 0.75rem;
  margin-right: 4px;
  opacity: 0.7;
}

:deep(.text-orange-400::before) {
  content: '▲';
  color: #f59e0b;
  font-size: 0.75rem;
  margin-right: 4px;
  opacity: 0.7;
}

/* Style pour l'en-tête principal */
:deep(.p-card-title) {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Style pour les badges */
:deep(.p-badge) {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-weight: 600;
}

/* Style pour les panneaux repliables */
:deep(.section-panel) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.p-panel .p-panel-header) {
  background: var(--surface-900) !important;
  border: none;
  border-radius: 0;
  padding: 1rem 1.5rem;
  transition: all 0.3s ease;
}

:deep(.p-panel .p-panel-header:hover) {
  background: var(--surface-800) !important;
}

:deep(.p-panel .p-panel-content) {
  border: none;
  border-radius: 0;
  padding: 0;
  background-color: white;
}

:deep(.p-panel.p-panel-toggleable .p-panel-header .p-panel-header-icon) {
  color: #6366f1;
  transition: all 0.3s ease;
}

:deep(.p-panel.p-panel-toggleable .p-panel-header .p-panel-header-icon:hover) {
  color: #4f46e5;
  transform: scale(1.1);
}

/* Animation pour le contenu des panneaux */
:deep(.p-panel .p-panel-content .p-toggleable-content) {
  animation: fadeIn 0.3s ease-out;
}

/* Style pour l'en-tête sticky dans le conteneur */
.sticky-header-container {
  position: relative;
}

.header-sticky {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Corrections pour les overflow qui cassent le sticky/fixed */
.card-no-overflow :deep(.p-card-content) {
  overflow: visible !important;
}

.content-no-overflow {
  overflow: visible !important;
}

.sections-container {
  overflow: visible !important;
}

:deep(.section-panel) {
  overflow: visible !important;
}

:deep(.p-panel) {
  overflow: visible !important;
}

:deep(.p-panel-content) {
  overflow: visible !important;
}

/* Responsive */
@media (max-width: 768px) {
  :deep(.comparison-table-section) {
    font-size: 0.875rem;
  }

  :deep(.comparison-table-section .p-datatable-tbody > tr > td) {
    padding: 8px 12px;
  }

  :deep(.section-panel:hover) {
    transform: none;
  }
}

/* Style pour le conteneur principal */
.space-y-1 > * + * {
  margin-top: 0.25rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

/* Animation au chargement */
.comparison-table-section {
  animation: fadeIn 0.5s ease-out;
}

/* Style pour l'en-tête avec colonnes égales */
.header-grid {
  display: grid;
  grid-template-columns: repeat(var(--total-columns), 1fr);
}
</style>
