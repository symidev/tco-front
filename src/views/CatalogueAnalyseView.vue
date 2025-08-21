<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

// Components
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Panel from 'primevue/panel';
import ToggleSwitch from 'primevue/toggleswitch';
import Checkbox from 'primevue/checkbox';

// Icons
import { BarChart3, AreaChart, FileSpreadsheet, FileText, Table } from 'lucide-vue-next';

// Services
import { catalogueService } from '@/services/api/catalogueService';

// State
const route = useRoute();
const router = useRouter();
const toast = useToast();

const catalogue = ref(null);
const loading = ref(true);
const displayMode = ref('table'); // 'table' ou 'charts'
const expandedSections = ref(new Set());
const selectedCategories = ref(new Set());

// Responsive scroll management
const headerScrollContainer = ref(null);
const sectionsData = ref([]);
const scrollListeners = ref([]);
const isScrollSyncing = ref(false);

// Configuration complète des sections d'analyse (comme ComparoAnalyseView)
const sectionsConfig = ref([]);

// Computed properties
const canDownloadFiles = computed(() => {
  return catalogue.value?.export_pdf || catalogue.value?.export_xls;
});

// Computed pour les catégories disponibles
const availableCategories = computed(() => {
  return catalogue.value?.categories || [];
});

// Initialiser toutes les catégories comme sélectionnées par défaut
const initializeCategories = () => {
  if (catalogue.value?.categories) {
    selectedCategories.value = new Set(catalogue.value.categories.map(cat => cat.uuid));
  }
};

// Computed pour calculer le TCO moyen
const getTCOMoyen = computed(() => {
  if (!getAllVehicules().length) return 0;
  const total = getAllVehicules().reduce((sum, vehicule) => {
    return sum + (vehicule.calcul?.tcoMensuel || 0);
  }, 0);
  return total / getAllVehicules().length;
});

// Methods
const loadCatalogueData = async () => {
  try {
    loading.value = true;
    const uuid = route.params.uuid;

    const response = await catalogueService.getCatalogueAnalyseByUuid(uuid);
    catalogue.value = response.data;

    // Initialiser toutes les catégories comme sélectionnées
    initializeCategories();
    
    // Préparer les données pour les tableaux
    prepareTableData();

  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur de chargement',
      detail: 'Impossible de charger les données d\'analyse du catalogue',
      life: 5000
    });
    router.push('/catalogues');
  } finally {
    loading.value = false;
  }
};

const prepareTableData = () => {
  if (!catalogue.value?.categories) return;

  // Créer la configuration des sections (comme ComparoAnalyseView)
  let labelPlage = '';
  if (catalogue.value.catalogue?.autonomie_elec_plage_min || catalogue.value.catalogue?.autonomie_elec_plage_max) {
    labelPlage = (catalogue.value.catalogue.autonomie_elec_plage_min || 0) + '% - ' + (catalogue.value.catalogue.autonomie_elec_plage_max || 100) + '%';
  }

  sectionsConfig.value = [
    {
      id: 'infos_vehicule',
      title: 'Infos véhicule',
      rows: [
        { id: 'marque', name: 'Marque', getValue: (v) => {
          const marque = typeof v.marque === 'object' ? (v.marque?.name || v.marque?.title) : v.marque;
          return marque || '-';
        }},
        { id: 'modele', name: 'Modèle', getValue: (v) => {
          const modele = typeof v.modele === 'object' ? (v.modele?.name || v.modele?.title) : v.modele;
          return modele || '-';
        }},
        { id: 'finition', name: 'Moteur/Finition', getValue: (v) => {
          const finition = typeof v.finition === 'object' ? (v.finition?.name || v.finition?.title) : v.finition;
          return finition || '-';
        }},
        { id: 'energie', name: 'Énergie', getValue: (v) => v.energie?.toUpperCase() || '-' },
        { id: 'conso_carb', name: 'Consommation carburant', getValue: (v) => v.conso_carb ? `${formatNumber(v.conso_carb, 1)} L/100km` : '-' },
        { id: 'conso_kwh', name: 'Consommation kwh', getValue: (v) => v.conso_kwh ? `${formatNumber(v.conso_kwh, 1)} kWh/100km` : '-' },
        { id: 'co2', name: 'Émission CO2 WLTP', getValue: (v) => v.co2 ? `${v.co2} g/km` : '-' },
        { id: 'autonomie', name: 'Autonomie batterie (WLTP)', getValue: (v) => v.autonomie ? `${v.autonomie} km` : '-' },
        { id: 'capacite_batterie', name: 'Capacité de la batterie', getValue: (v) => v.capacite_batterie ? `${v.capacite_batterie} kWh` : '-' },
        { id: 'vitesse_recharge', name: 'Capacité de recharge de la batterie', getValue: (v) => v.vitesse_recharge_batterie ? `${v.vitesse_recharge_batterie} kW` : '-' },
        { id: 'prix', name: 'Prix du véhicule non remisé', getValue: (v) => formatCurrency(v.prix || 0) },
        { id: 'prix_options', name: 'Montant option(s) non remisé', getValue: (v) => formatCurrency(v.prix_options || 0) },
        {
          id: 'prix_total',
          name: 'Prix total avec options',
          getValue: (v) => formatCurrency((v.prix || 0) + (v.prix_options || 0)),
          field: 'prix_vehicule',
          getClass: (v) => getCellClass((v.prix || 0) + (v.prix_options || 0), 'prix_vehicule')
        },
        { id: 'remise', name: 'Remise en %', getValue: (v) => formatPercent(v.remise || 0) },
        {
          id: 'prix_remise',
          name: 'Prix remisé TTC',
          getValue: (v) => {
            const prixTotal = (v.prix || 0) + (v.prix_options || 0);
            const remiseDecimal = (v.remise || 0) / 100;
            return formatCurrency(prixTotal * (1 - remiseDecimal));
          },
          field: 'prix_vehicule',
          getClass: (v) => {
            const prixTotal = (v.prix || 0) + (v.prix_options || 0);
            const remiseDecimal = (v.remise || 0) / 100;
            return getCellClass(prixTotal * (1 - remiseDecimal), 'prix_vehicule');
          }
        }
      ]
    },
    {
      id: 'contrat',
      title: 'Contrat',
      rows: [
        { id: 'loyer_financier', name: 'Loyer Financier', getValue: (v) => formatCurrency(v.loyer_financier || 0) },
        { id: 'entretien', name: 'Entretien', getValue: (v) => formatCurrency(v.entretien || 0) },
        { id: 'pneumatiques', name: 'Pneumatiques', getValue: (v) => formatCurrency(v.pneumatique || 0) },
        { id: 'gardiennage_pneumatiques', name: 'Gardiennage des pneumatiques', getValue: (v) => formatCurrency(v.pneumatique_garde || 0) },
        { id: 'vehicule_relais', name: 'Véhicule Relais', getValue: (v) => formatCurrency(v.vehicule_relais || 0) },
        { id: 'assurance_rc', name: 'Assurance RC', getValue: (v) => formatCurrency(v.assurance_rc || 0) },
        { id: 'assurance_dommages', name: 'Assurance Dommages', getValue: (v) => formatCurrency(v.assurance_dommage || 0) },
        { id: 'perte_financiere', name: 'Perte Financière', getValue: (v) => formatCurrency(v.perte_fi || 0) },
        { id: 'carte_carburant', name: 'Carte (s) Carburant', getValue: (v) => formatCurrency(v.carte_carb || 0) },
        { id: 'carte_electrique', name: 'Carte électrique', getValue: (v) => formatCurrency(v.carte_elec || 0) },
        { id: 'badge_telepeage', name: 'Badge Télépéage', getValue: (v) => formatCurrency(v.badge_telepeage || 0) },
        { id: 'pastille_critair', name: 'Pastille Crit\'Air', getValue: (v) => formatCurrency(v.vignette_critair || 0) },
        { id: 'autre_cout', name: 'Autre coût', getValue: (v) => formatCurrency(v.autre_cout || 0) },
        {
          id: 'loyer_total',
          name: 'Loyer total',
          getValue: (v) => formatCurrency(v.calcul?.loyer_total || 0),
          field: 'loyer_total',
          getClass: (v) => getCellClass(v.calcul?.loyer_total || 0, 'loyer_total')
        },
        {
          id: 'prk_contrat',
          name: 'PRK /km',
          getValue: (v) => formatCurrency(v.calcul?.prk || 0),
          field: 'prk_contrat',
          getClass: (v) => getCellClass(v.calcul?.prk || 0, 'prk_contrat')
        }
      ]
    },
    {
      id: 'fiscalite',
      title: 'Fiscalité',
      rows: [
        { id: 'malus_co2', name: 'Malus CO² (une fois)', getValue: (v) => formatCurrency(v.calcul?.malus_co2 || 0) },
        { id: 'taxe_co2', name: 'Taxe C0² (annuelle)', getValue: (v) => formatCurrency(v.calcul?.taxe_co2 || 0) },
        { id: 'taxe_polluant', name: 'Taxe polluants (annuelle)', getValue: (v) => formatCurrency(v.calcul?.taxe_polluant || 0) },
        { id: 'taxe_masse', name: 'Taxe à la masse (une fois)', getValue: (v) => formatCurrency(v.calcul?.taxe_masse || 0) },
        {
          id: 'fiscalite_mensuelle',
          name: 'Fiscalité mensuelle',
          getValue: (v) => formatCurrency(v.calcul?.fiscalite_mensuel || 0),
          field: 'fiscalite',
          getClass: (v) => getCellClass(v.calcul?.fiscalite_mensuel || 0, 'fiscalite')
        }
      ]
    },
    {
      id: 'energie',
      title: 'Énergie',
      rows: [
        { id: 'energie_thermique', name: 'Prix de l\'énergie Thermique €', getValue: (v) => v.calcul?.prix_energie_thermique ? formatCurrency(v.calcul.prix_energie_thermique) : '-' },
        { id: 'energie_electrique', name: 'Prix de l\'énergie Electrique €', getValue: (v) => v.calcul?.prix_energie_electrique ? formatCurrency(v.calcul.prix_energie_electrique) : '-' },
        {
          id: 'budget_energie_mensuel',
          name: 'Budget énergie mensuel',
          getValue: (v) => formatCurrency(v.calcul?.budget_mensuel_total_energie || 0),
          field: 'budget_energie_mensuel',
          getClass: (v) => getCellClass(v.calcul?.budget_mensuel_total_energie || 0, 'budget_energie_mensuel')
        }
      ]
    },
    {
      id: 'is_and',
      title: 'IS sur AND',
      rows: [
        { id: 'pct_imposition_client', name: '% d\'imposition Client (IS)', getValue: (v) => formatPercent(catalogue.value?.is || 0) },
        { id: 'plafond_and', name: 'Plafond d\'AND', getValue: (v) => formatCurrency(v.calcul?.plafondAnd || 0) },
        { id: 'calcul_and_mensuel', name: 'Calcul AND Mensuel', getValue: (v) => formatCurrency(v.calcul?.andMensuel || 0) },
        {
          id: 'is_and_value',
          name: 'IS sur AND',
          getValue: (v) => formatCurrency(v.calcul?.isAnd || 0),
          field: 'is_and_value',
          getClass: (v) => getCellClass(v.calcul?.isAnd || 0, 'is_and_value')
        }
      ]
    },
    {
      id: 'aen_details',
      title: 'AEN',
      rows: [
        { id: 'taux_aen', name: 'Taux AEN', getValue: (v) => formatPercent(v.aen || 0) },
        { id: 'aen_mensuel_detail', name: 'AEN Mensuel', getValue: (v) => formatCurrency(v.calcul?.aenMensuel || 0) },
        { id: 'taux_charges_patronales', name: 'Taux charges patronales', getValue: (v) => formatPercent(v.chargePatronale || 0) },
        {
          id: 'aen_charge',
          name: 'Charges patronales sur AEN',
          getValue: (v) => formatCurrency(v.calcul?.aenChargePatronale || 0),
          field: 'aen_charge',
          getClass: (v) => getCellClass(v.calcul?.aenChargePatronale || 0, 'aen_charge')
        }
      ]
    },
    {
      id: 'tco',
      title: 'TCO',
      rows: [
        {
          id: 'tco_mensuel',
          name: 'TCO mensuel',
          getValue: (v) => formatCurrency(v.calcul?.tcoMensuel || 0),
          field: 'tco_mensuel',
          getClass: (v) => getCellClass(v.calcul?.tcoMensuel || 0, 'tco_mensuel')
        },
        { id: 'tco_moyen', name: 'TCO Moyen mensuel', getValue: () => formatCurrency(getTCOMoyen.value) },
        {
          id: 'prk',
          name: 'PRK /km',
          getValue: (v) => formatCurrency(getPRK(v)),
          field: 'prk',
          getClass: (v) => getCellClass(getPRK(v), 'prk')
        },
        { id: 'tco_total', name: 'TCO Total (durée du contrat)', getValue: (v) => formatCurrency((v.calcul?.tcoMensuel || 0) * (v.duree || 36)) }
      ]
    },
    {
      id: 'ventilation_tco',
      title: 'Ventilation TCO',
      rows: [
        { id: 'tco_loyer', name: 'Loyer et services (en %)', getValue: (v) => formatPercent(getTCOVentilation(v, 'loyer')) },
        { id: 'tco_fiscalite', name: 'Fiscalité (en %)', getValue: (v) => formatPercent(getTCOVentilation(v, 'fiscalite')) },
        { id: 'tco_carburant', name: 'Carburant (en %)', getValue: (v) => formatPercent(getTCOVentilation(v, 'carburant')) },
        { id: 'aen_charge', name: 'Charges sur AEN (en %)', getValue: (v) => formatPercent(getTCOVentilation(v, 'aenCharge')) },
        { id: 'is_and', name: 'IS sur AND (en %)', getValue: (v) => formatPercent(getTCOVentilation(v, 'isAnd')) }
      ]
    }
  ];

  // Créer les données pour chaque section séparément (comme ComparoAnalyseView)
  const sectionDataMap = {};
  const allVehicules = getAllVehicules();

  sectionsConfig.value.forEach(section => {
    const coloredRows = [];
    const nonColoredRows = [];

    section.rows.forEach(row => {
      const rowData = {
        id: row.id,
        type: 'data',
        label: row.name,
        field: row.field || null,
        hasColor: !!row.field && !!row.getClass
      };

      // Ajouter une colonne pour chaque véhicule
      allVehicules.forEach((vehicule, index) => {
        rowData[`vehicule_${index}`] = {
          value: row.getValue(vehicule),
          class: row.getClass ? row.getClass(vehicule) : ''
        };
      });

      // Séparer les lignes avec et sans couleur
      if (rowData.hasColor) {
        coloredRows.push(rowData);
      } else {
        nonColoredRows.push(rowData);
      }
    });

    sectionDataMap[section.id] = {
      coloredRows,
      nonColoredRows,
      hasColoredRows: coloredRows.length > 0,
      hasNonColoredRows: nonColoredRows.length > 0,
      allRows: [...coloredRows, ...nonColoredRows],
      title: section.title,
      vehiculesColumns: allVehicules
    };
  });

  sectionsData.value = sectionDataMap;
};

// Récupérer tous les véhicules avec leurs catégories (filtrés par catégories sélectionnées)
const getAllVehicules = () => {
  const vehicules = [];

  if (!catalogue.value?.categories) return vehicules;

  catalogue.value.categories.forEach(category => {
    // Ne garder que les catégories sélectionnées
    if (selectedCategories.value.has(category.uuid)) {
      category.vehicules?.forEach(vehicule => {
        vehicules.push({
          ...vehicule,
          categoryTitle: category.title,
          categoryUuid: category.uuid
        });
      });
    }
  });

  return vehicules;
};

// Toggle d'une catégorie
const toggleCategory = (categoryUuid) => {
  const newSelectedCategories = new Set(selectedCategories.value);
  if (newSelectedCategories.has(categoryUuid)) {
    newSelectedCategories.delete(categoryUuid);
  } else {
    newSelectedCategories.add(categoryUuid);
  }
  selectedCategories.value = newSelectedCategories;
  // Recalculer les données des tableaux
  prepareTableData();
};

// Sélectionner/désélectionner toutes les catégories
const toggleAllCategories = () => {
  if (selectedCategories.value.size === catalogue.value?.categories?.length) {
    selectedCategories.value = new Set(); // Créer un nouveau Set vide
  } else {
    selectedCategories.value = new Set(catalogue.value?.categories?.map(cat => cat.uuid) || []);
  }
  prepareTableData();
};

// Fonctions pour calculs min/max (comme ComparoAnalyseView)
const getMinValue = (field) => {
  const allVehicules = getAllVehicules();
  if (!allVehicules.length) return Infinity;

  let values = allVehicules.map(vehicule => {
    switch (field) {
      case 'prix_vehicule':
        return vehicule.calcul?.prix_total_sans_remise || vehicule.prix || 0;
      case 'loyer_total':
        return vehicule.calcul?.loyer_total || 0;
      case 'fiscalite':
        return vehicule.calcul?.fiscalite_mensuel || 0;
      case 'budget_energie_mensuel':
        return vehicule.calcul?.budget_mensuel_total_energie || 0;
      case 'tco_mensuel':
        return vehicule.calcul?.tcoMensuel || 0;
      case 'prk_contrat':
        return vehicule.calcul?.prk || 0;
      case 'is_and_value':
        return vehicule.calcul?.isAnd || 0;
      case 'aen_charge':
        return vehicule.calcul?.aenChargePatronale || 0;
      default:
        return 0;
    }
  });

  return Math.min(...values);
};

const getMaxValue = (field) => {
  const allVehicules = getAllVehicules();
  if (!allVehicules.length) return -Infinity;

  let values = allVehicules.map(vehicule => {
    switch (field) {
      case 'prix_vehicule':
        return vehicule.calcul?.prix_total_sans_remise || vehicule.prix || 0;
      case 'loyer_total':
        return vehicule.calcul?.loyer_total || 0;
      case 'fiscalite':
        return vehicule.calcul?.fiscalite_mensuel || 0;
      case 'budget_energie_mensuel':
        return vehicule.calcul?.budget_mensuel_total_energie || 0;
      case 'tco_mensuel':
        return vehicule.calcul?.tcoMensuel || 0;
      case 'prk_contrat':
        return vehicule.calcul?.prk || 0;
      case 'is_and_value':
        return vehicule.calcul?.isAnd || 0;
      case 'aen_charge':
        return vehicule.calcul?.aenChargePatronale || 0;
      default:
        return 0;
    }
  });

  return Math.max(...values);
};

// Fonction pour déterminer les styles conditionnels
const getCellClass = (value, field) => {
  const min = getMinValue(field);
  const max = getMaxValue(field);

  if (value === min) return 'text-green-400';
  if (value === max) return 'text-amber-400';
  return '';
};


// Utility functions for calculations (simplified versions)
const getVehicleLabel = (vehicule) => {
  // Debug pour voir la structure des données
  // Gérer les objets imbriqués potentiels
  const marque = typeof vehicule.marque === 'object'
    ? (vehicule.marque?.name || vehicule.marque?.title || '[Marque inconnue]')
    : (vehicule.marque || '[Marque inconnue]');

  const modele = typeof vehicule.modele === 'object'
    ? (vehicule.modele?.name || vehicule.modele?.title || '[Modèle inconnu]')
    : (vehicule.modele || '[Modèle inconnu]');

  const finition = typeof vehicule.finition === 'object'
    ? (vehicule.finition?.name || vehicule.finition?.title || '')
    : (vehicule.finition || '');

  const parts = [marque, modele, finition].filter(part => part && part !== '[Marque inconnue]' && part !== '[Modèle inconnu]');
  return parts.join(' ') || 'Véhicule sans nom';
};

const getTCOTotal = (vehicule) => {
  return vehicule.tco_total || 0;
};

const getTCOMensuel = (vehicule) => {
  return vehicule.tco_mensuel || 0;
};

const getPrixTotal = (vehicule) => {
  return vehicule.prix_total || 0;
};

const getLoyerTotal = (vehicule) => {
  return vehicule.loyer_total || 0;
};

const getFiscaliteMensuelle = (vehicule) => {
  return vehicule.fiscalite_mensuelle || 0;
};

const getAenCharge = (vehicule) => {
  return vehicule.aen_charge || 0;
};

// Formatting functions
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value) => {
  if (value === undefined || value === null) return '';
  return `${value}%`;
};

const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: decimals
  }).format(value);
};

// Fonction pour calculer le PRK
const getPRK = (vehicule) => {
  return vehicule.calcul?.prk || 0;
};

// Fonction pour calculer la ventilation TCO
const getTCOVentilation = (vehicule, type) => {
  const tcoMensuel = vehicule.calcul?.tcoMensuel || 0;
  if (tcoMensuel === 0) return 0;

  switch (type) {
    case 'loyer':
      return Math.round(((vehicule.calcul?.loyer_total || 0) / tcoMensuel) * 100);
    case 'fiscalite':
      return Math.round(((vehicule.calcul?.fiscalite_mensuel || 0) / tcoMensuel) * 100);
    case 'carburant':
      return Math.round(((vehicule.calcul?.budget_mensuel_total_energie || 0) / tcoMensuel) * 100);
    case 'aenCharge':
      return Math.round(((vehicule.calcul?.aenChargePatronale || 0) / tcoMensuel) * 100);
    case 'isAnd':
      return Math.round(((vehicule.calcul?.isAnd || 0) / tcoMensuel) * 100);
    default:
      return 0;
  }
};


// Section management
const toggleSection = (sectionId) => {
  if (expandedSections.value.has(sectionId)) {
    expandedSections.value.delete(sectionId);
  } else {
    expandedSections.value.add(sectionId);
  }
  expandedSections.value = new Set(expandedSections.value);
};

// Download functions
const downloadExcel = async () => {
  if (catalogue.value?.export_xls?.url) {
    window.open(catalogue.value.export_xls.url, '_blank');
  } else {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Le fichier Excel n\'est pas disponible',
      life: 3000
    });
  }
};

const downloadPDF = async () => {
  if (catalogue.value?.export_pdf?.url) {
    window.open(catalogue.value.export_pdf.url, '_blank');
  } else {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Le fichier PDF n\'est pas disponible',
      life: 3000
    });
  }
};

// Improved scroll synchronization system
const syncScrollPosition = (sourceElement, scrollLeft) => {
  if (isScrollSyncing.value) return;

  isScrollSyncing.value = true;

  // Find all scrollable elements within sync containers
  const syncContainers = document.querySelectorAll('.sync-scroll-container');
  const allScrollableElements = [];

  syncContainers.forEach(syncContainer => {
    // Look for the actual scrollable element (p-datatable-table-container)
    const scrollableElement = syncContainer.querySelector('.p-datatable-table-container');
    if (scrollableElement) {
      allScrollableElements.push(scrollableElement);
    }
  });

  console.log('Syncing scroll across', allScrollableElements.length, 'elements, scrollLeft:', scrollLeft);

  // Synchronize all scrollable elements except the source
  allScrollableElements.forEach(element => {
    if (element && element !== sourceElement && element.scrollLeft !== scrollLeft) {
      element.scrollLeft = scrollLeft;
      console.log('Updated scroll for element:', element);
    }
  });

  setTimeout(() => {
    isScrollSyncing.value = false;
  }, 10);
};

const syncNewElementsToCurrentScroll = () => {
  // Get current scroll position from the first visible scrollable element
  const firstScrollableElement = document.querySelector('.sync-scroll-container .p-datatable-table-container');
  if (!firstScrollableElement) return;
  
  const currentScrollLeft = firstScrollableElement.scrollLeft;
  console.log('Current scroll position:', currentScrollLeft);
  
  // Apply this scroll position to all scrollable elements
  const allScrollableElements = document.querySelectorAll('.sync-scroll-container .p-datatable-table-container');
  allScrollableElements.forEach(element => {
    if (element.scrollLeft !== currentScrollLeft) {
      element.scrollLeft = currentScrollLeft;
      console.log('Synced new element to current scroll position:', element);
    }
  });
};

const attachScrollListeners = () => {
  // Clean up existing listeners first
  cleanupScrollListeners();

  nextTick(() => {
    // Wait a bit more for all DataTables to be rendered
    setTimeout(() => {
      // Find all DataTable wrappers directly
      const allDataTableWrappers = document.querySelectorAll('.p-datatable-wrapper');
      console.log(`Found ${allDataTableWrappers.length} DataTable wrappers:`, allDataTableWrappers);
      
      // Also check for sync containers
      const syncContainers = document.querySelectorAll('.sync-scroll-container');
      console.log(`Found ${syncContainers.length} sync containers:`, syncContainers);
      
      // Try to find scrollable elements in sync containers
      syncContainers.forEach((syncContainer, index) => {
        console.log(`Container ${index}:`, syncContainer);
        
        // Look for different possible scrollable elements
        const dataTableWrapper = syncContainer.querySelector('.p-datatable-wrapper');
        const dataTable = syncContainer.querySelector('.p-datatable');
        const scrollableDiv = syncContainer.querySelector('[style*="overflow"]');
        
        console.log(`In container ${index}:`);
        console.log(`- .p-datatable-wrapper:`, dataTableWrapper);
        console.log(`- .p-datatable:`, dataTable);
        console.log(`- scrollable div:`, scrollableDiv);
        
        // Find the actual scrollable element
        let scrollableElement = null;
        if (dataTableWrapper && dataTableWrapper.scrollWidth > dataTableWrapper.clientWidth) {
          scrollableElement = dataTableWrapper;
        } else if (dataTable && dataTable.scrollWidth > dataTable.clientWidth) {
          scrollableElement = dataTable;
        } else if (scrollableDiv && scrollableDiv.scrollWidth > scrollableDiv.clientWidth) {
          scrollableElement = scrollableDiv;
        }
        
        if (scrollableElement) {
          console.log(`Found scrollable element in container ${index}:`, scrollableElement);
          console.log(`ScrollWidth: ${scrollableElement.scrollWidth}, ClientWidth: ${scrollableElement.clientWidth}`);
          
          const scrollHandler = (e) => {
            console.log('Scroll detected on element:', e.target);
            syncScrollPosition(e.target, e.target.scrollLeft);
          };
          
          scrollableElement.addEventListener('scroll', scrollHandler, { passive: true });
          scrollListeners.value.push({
            element: scrollableElement,
            handler: scrollHandler
          });
          console.log(`Added listener to container ${index}`);
        } else {
          console.log(`No scrollable element found in container ${index}`);
        }
      });
      
      // Sync all elements to current scroll position
      syncNewElementsToCurrentScroll();

    }, 300);
  });
};

const cleanupScrollListeners = () => {
  scrollListeners.value.forEach(({ element, handler }) => {
    if (element && handler) {
      element.removeEventListener('scroll', handler);
    }
  });
  scrollListeners.value = [];
};

// Lifecycle
onMounted(() => {
  loadCatalogueData();
});

onBeforeUnmount(() => {
  cleanupScrollListeners();
});

// Watchers for re-attaching scroll listeners when content changes
watch(sectionsData, () => {
  // Re-attach listeners when sections data changes
  setTimeout(attachScrollListeners, 300);
}, { deep: true });

watch(expandedSections, () => {
  // Re-attach listeners when sections are expanded/collapsed
  nextTick(() => {
    setTimeout(() => {
      attachScrollListeners();
      // Extra delay to ensure new elements are fully rendered
      setTimeout(syncNewElementsToCurrentScroll, 100);
    }, 300);
  });
}, { deep: true });

watch(displayMode, () => {
  // Re-attach listeners when display mode changes
  nextTick(() => {
    setTimeout(attachScrollListeners, 300);
  });
});

// Re-attach listeners after data is loaded
watch(catalogue, (newCatalogue) => {
  if (newCatalogue) {
    nextTick(() => {
      setTimeout(attachScrollListeners, 500);
    });
  }
});

// Watch pour les catégories sélectionnées
watch(selectedCategories, () => {
  // Recalculer les données des tableaux quand les catégories changent
  if (catalogue.value) {
    prepareTableData();
    // Re-attacher les listeners après recalcul
    nextTick(() => {
      setTimeout(attachScrollListeners, 300);
    });
  }
}, { deep: true });
</script>

<template>
  <div class="page-container">
    <div class="page-content">
      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <ProgressSpinner class="loading-spinner" />
          <p class="loading-text">Chargement de l'analyse...</p>
        </div>
      </div>

      <!-- Content -->
      <div v-else-if="catalogue" class="content-grid animate-slide-in-up">
        <!-- Header Section -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <BarChart3 class="section-icon" />
              <div class="flex flex-col gap-3 flex-1">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h2 class="text-2xl font-bold">{{ catalogue.catalogue?.title }}</h2>
                    <div class="flex flex-wrap gap-2">
                      <div class="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2v6a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6z"/>
                        </svg>
                        {{ catalogue.categories?.length || 0 }} catégories
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-3">
                    <Button
                      v-if="canDownloadFiles"
                      class="export-btn export-excel"
                      @click="downloadExcel"
                      :disabled="!catalogue.export_xls"
                    >
                      <FileSpreadsheet class="w-4 h-4" />
                      <span class="export-text">Excel</span>
                    </Button>

                    <Button
                      v-if="canDownloadFiles"
                      class="export-btn export-pdf"
                      @click="downloadPDF"
                      :disabled="!catalogue.export_pdf"
                    >
                      <FileText class="w-4 h-4" />
                      <span class="export-text">PDF</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="section-content">
            <div class="p-3">
              <!-- Mode toggle -->
              <div class="animate-fade-in">
                <div class="flex justify-center mb-3">
                  <div class="header-criteria bg-surface-900 p-3 font-medium text-white border-0 text-sm flex items-center rounded-lg">
                    <span class="text-base cursor-pointer hover:text-gray-300 transition-colors duration-200 flex items-center gap-2">
                      <Table class="h-5 w-5" />
                      <span class="hidden sm:inline">Tableau</span>
                    </span>
                    <ToggleSwitch
                      v-model="displayMode"
                      class="mode-toggle-switch"
                      true-value="charts"
                      false-value="table"
                    />
                    <span class="text-base cursor-pointer hover:text-gray-300 transition-colors duration-200 flex items-center gap-2">
                      <AreaChart class="h-5 w-5" />
                      <span class="hidden sm:inline">Graphiques</span>
                    </span>
                  </div>
                </div>
                
                <!-- Filtres par catégorie -->
                <div v-if="availableCategories.length > 0" class="mt-4">
                  <div class="bg-surface-900 p-4 rounded-lg">
                    <div class="flex flex-col gap-3">
                      <div class="flex items-center justify-between">
                        <h3 class="text-white font-medium text-sm">Filtrer par catégorie :</h3>
                        <button 
                          @click="toggleAllCategories"
                          class="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          {{ selectedCategories.size === availableCategories.length ? 'Tout désélectionner' : 'Tout sélectionner' }}
                        </button>
                      </div>
                      <div class="flex flex-wrap gap-4">
                        <div 
                          v-for="category in availableCategories" 
                          :key="category.uuid"
                          class="flex items-center gap-2 text-white"
                        >
                          <Checkbox 
                            :inputId="`category-${category.uuid}`"
                            :value="category.uuid"
                            :checked="selectedCategories.has(category.uuid)"
                            @change="toggleCategory(category.uuid)"
                            class="category-checkbox"
                          />
                          <label 
                            :for="`category-${category.uuid}`" 
                            class="text-sm cursor-pointer category-filter-label"
                          >
                            {{ category.title }} ({{ category.vehicules?.length || 0 }})
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sections d'analyse -->
              <div class="space-y-4 sections-container">
                <div v-for="section in sectionsConfig" :key="section.id" class="section-wrapper mb-4">
                  <!-- Header de section -->
                  <div
                    class="section-header-custom bg-surface-900 p-3 border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-t-lg"
                    :class="[
                      section.id === 'tco' ? 'tco-section' : '',
                      { 'cursor-pointer': sectionsData[section.id]?.hasNonColoredRows }
                    ]"
                    @click="sectionsData[section.id]?.hasNonColoredRows && toggleSection(section.id)"
                  >
                    <div class="flex items-center gap-2 w-full">
                      <span class="font-medium text-white text-lg">{{ section.title }}</span>
                      <div v-if="sectionsData[section.id]?.hasNonColoredRows" class="ml-auto flex items-center gap-2">
                        <span class="text-xs text-white hidden sm:inline">
                          {{ expandedSections.has(section.id) ? 'Cliquez ici pour masquer' : 'Cliquez ici pour voir plus' }}
                        </span>
                        <div
                          class="rounded-full p-2 transition-all duration-200 transform hover:scale-110 shadow-lg"
                          :class="section.id === 'tco' ? 'bg-white hover:bg-gray-100' : 'bg-amber-500 hover:bg-amber-500'"
                        >
                          <svg
                            class="w-4 h-4 transition-transform duration-300"
                            :class="[
                              { 'rotate-180': expandedSections.has(section.id) },
                              section.id === 'tco' ? 'text-amber-500' : 'text-white'
                            ]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Contenu de section -->
                  <div class="bg-transparent rounded-b-lg shadow-sm overflow-x-auto section-content-wrapper section-scroll-container"
                       :data-section-id="section.id">

                    <!-- Lignes non-colorées (conditionnelles) -->
                    <div
                      v-if="sectionsData[section.id]?.hasNonColoredRows && expandedSections.has(section.id)"
                      class="non-colored-rows-container sync-scroll-container"
                    >
                      <DataTable
                        :value="sectionsData[section.id].nonColoredRows"
                        class="comparison-table comparison-animate-load"
                        responsive-layout="scroll"
                        :scrollable="true"
                        scroll-direction="horizontal"
                      >
                        <!-- Colonne fixe pour les critères -->
                        <Column class="property-column" style="min-width: 300px;">
                          <template #header>
                            <div class="font-medium text-white py-1 text-sm flex items-center h-10">
                              Véhicule
                            </div>
                          </template>
                          <template #body="slotProps">
                            <div class="font-medium py-1 text-sm flex items-center h-10 bg-surface-800 text-white">
                              {{ slotProps.data.label }}
                            </div>
                          </template>
                        </Column>

                        <!-- Colonnes dynamiques pour chaque véhicule -->
                        <Column
                          v-for="(vehicule, index) in sectionsData[section.id].vehiculesColumns"
                          :key="`noncolored_${vehicule.uuid}`"
                          class="value-column"
                          style="min-width: 200px;"
                        >
                          <template #header>
                            <div class="font-medium text-white text-center py-1 text-xs flex flex-col items-center justify-center min-h-16 px-1">
                              <div class="font-medium text-xs leading-tight break-words text-center w-full">{{ getVehicleLabel(vehicule) }}</div>
                              <div class="text-xs text-blue-400 mt-1">{{ vehicule.categoryTitle }}</div>
                              <div class="text-xs text-gray-400 mt-1">{{ vehicule.loueur?.name || '' }}</div>
                            </div>
                          </template>
                          <template #body="slotProps">
                            <div class="text-center py-1 font-medium transition-all duration-200 rounded px-2 text-sm flex items-center justify-center min-h-10 bg-surface-700 break-words">
                              {{ slotProps.data[`vehicule_${index}`]?.value || '-' }}
                            </div>
                          </template>
                        </Column>
                      </DataTable>
                    </div>

                    <!-- Lignes colorées (toujours visibles, en bas) -->
                    <div v-if="sectionsData[section.id]?.hasColoredRows" class="colored-rows-container sync-scroll-container">
                      <DataTable
                        :value="sectionsData[section.id].coloredRows"
                        class="comparison-table comparison-animate-load always-visible"
                        responsive-layout="scroll"
                        :scrollable="true"
                        scroll-direction="horizontal"
                      >
                        <!-- Colonne fixe pour les critères -->
                        <Column class="property-column" style="min-width: 300px;">
                          <template #header v-if="!sectionsData[section.id]?.hasNonColoredRows || !expandedSections.has(section.id)">
                            <div class="font-medium text-white py-1 text-sm flex items-center h-10">
                              Véhicule
                            </div>
                          </template>
                          <template #body="slotProps">
                            <div class="font-medium py-1 text-sm flex items-center h-10 bg-surface-800 text-white">
                              {{ slotProps.data.label }}
                            </div>
                          </template>
                        </Column>

                        <!-- Colonnes dynamiques pour chaque véhicule -->
                        <Column
                          v-for="(vehicule, index) in sectionsData[section.id].vehiculesColumns"
                          :key="`colored_${vehicule.uuid}`"
                          class="value-column"
                          style="min-width: 200px;"
                        >
                          <template #header v-if="!sectionsData[section.id]?.hasNonColoredRows || !expandedSections.has(section.id)">
                            <div class="font-medium text-white text-center py-1 text-xs flex flex-col items-center justify-center min-h-16 px-1">
                              <div class="font-medium text-xs leading-tight break-words text-center w-full">{{ getVehicleLabel(vehicule) }}</div>
                              <div class="text-xs text-blue-400 mt-1">{{ vehicule.categoryTitle }}</div>
                              <div class="text-xs text-gray-400 mt-1">{{ vehicule.loueur?.name || '' }}</div>
                            </div>
                          </template>
                          <template #body="slotProps">
                            <div class="text-center py-1 font-medium transition-all duration-200 rounded px-2 text-sm flex items-center justify-center min-h-10 bg-surface-700 break-words"
                                 :class="slotProps.data[`vehicule_${index}`]?.class || ''">
                              {{ slotProps.data[`vehicule_${index}`]?.value || '-' }}
                            </div>
                          </template>
                        </Column>
                      </DataTable>
                    </div>

                  </div>
                </div>
              </div>

              <!-- Retour -->
              <div class="flex justify-start mt-3">
                <Button @click="router.push('/catalogues')" class="btn-primary w-[200px] min-w-[200px]">
                  Retour aux catalogues
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
/* Animation pour l'apparition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Panel customization */
:deep(.p-panel .p-panel-header) {
  background: rgb(30 41 59);
  color: white;
  border: none;
  border-radius: 0.5rem 0.5rem 0 0;
}

:deep(.p-panel .p-panel-header:hover) {
  background: rgb(51 65 85);
}

:deep(.p-panel .p-panel-content) {
  border: none;
  border-radius: 0 0 0.5rem 0.5rem;
}

:deep(.p-panel.p-panel-toggleable .p-panel-header .p-panel-header-icon) {
  color: rgb(251 191 36);
}

:deep(.p-panel.p-panel-toggleable .p-panel-header .p-panel-header-icon:hover) {
  color: rgb(245 158 11);
}

.sections-container {
  scroll-behavior: smooth;
}

:deep(.p-panel) {
  margin-bottom: 1rem;
}

:deep(.p-panel-content) {
  padding: 0;
}

/* Header styling */
.page-header {
  background: linear-gradient(135deg, rgb(30 41 59) 0%, rgb(51 65 85) 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 1024px) {
  .header-content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .title-section {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
}

@media (max-width: 1023px) {
  .header-content {
    text-align: center;
  }

  .title-section {
    align-items: center;
  }
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-subtitle {
  color: rgb(203 213 225);
  font-size: 1.125rem;
  margin: 0;
}

.title-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: rgb(251 191 36);
}

/* Mode toggle styling */
.mode-toggle-switch {
  margin: 0 1rem;
}

/* Header grid */
.comparison-header-grid {
  display: grid;
  grid-template-columns: 300px repeat(auto-fit, minmax(200px, 1fr));
  min-width: fit-content;
}

.comparison-header-grid > div {
  min-width: 200px;
}

/* Table styling */
:deep(.comparison-table .p-datatable-table) {
  min-width: 100%;
  table-layout: fixed;
}

:deep(.comparison-table .p-datatable-thead > tr > th) {
  background: rgb(30 41 59) !important;
  color: white !important;
  border: 1px solid rgb(51 65 85) !important;
  padding: 0.5rem !important;
  text-align: center !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
}

:deep(.comparison-table .p-datatable-tbody > tr > td) {
  padding: 0.25rem !important;
  border: 1px solid rgb(51 65 85) !important;
  vertical-align: middle !important;
  background: rgb(30 41 59) !important;
  color: white !important;
}

:deep(.comparison-table .property-column) {
  width: 300px !important;
  min-width: 300px !important;
  max-width: 300px !important;
  position: sticky !important;
  left: 0 !important;
  z-index: 5 !important;
  background: rgb(30 41 59) !important;
}

:deep(.comparison-table .value-column) {
  width: 200px !important;
  min-width: 200px !important;
  text-align: center !important;
}

/* Collapse animation */
.collapse-enter-active, .collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from, .collapse-enter-to {
  max-height: 0;
  opacity: 0;
}

.collapse-leave-from, .collapse-leave-to {
  max-height: 1000px;
  opacity: 1;
}

/* Section content wrapper */
.section-content-wrapper {
  max-height: none;
  overflow-x: auto;
  overflow-y: visible;
}

/* Table responsive */
:deep(.comparison-table .p-datatable-table) {
  border-collapse: separate;
  border-spacing: 0;
}

:deep(.comparison-table .p-datatable-wrapper) {
  overflow-x: auto;
  overflow-y: visible;
}

:deep(.comparison-table) {
  width: 100%;
  overflow-x: auto;
}

:deep(.comparison-table .p-datatable-thead > tr > th) {
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

:deep(.comparison-table .p-datatable-tbody > tr > td) {
  white-space: nowrap;
}

:deep(.comparison-table .property-column) {
  position: sticky;
  left: 0;
  z-index: 5;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
}

:deep(.comparison-table .value-column) {
  min-width: 150px;
}

/* Export buttons */
.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.export-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.export-btn:active {
  transform: translateY(0);
}

.export-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.export-btn:hover::before {
  left: 100%;
}

.export-excel {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
}

.export-excel:hover {
  background: linear-gradient(135deg, #059669, #047857);
}

.export-pdf {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
}

.export-pdf:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.export-text {
  font-weight: 600;
}

@media (max-width: 640px) {
  .export-btn {
    padding: 0.5rem;
  }

  .export-text {
    display: none;
  }
}

/* TCO Section special styling */
.tco-section {
  background: linear-gradient(135deg, rgb(251 191 36), rgb(245 158 11)) !important;
}

.tco-section:hover {
  background: linear-gradient(135deg, rgb(245 158 11), rgb(217 119 6)) !important;
}

.tco-section ~ .section-content .comparison-grid .grid-row:nth-child(even) {
  background: rgba(251, 191, 36, 0.1);
}

.tco-section ~ .section-content .comparison-grid .grid-row:nth-child(odd) {
  background: rgba(251, 191, 36, 0.05);
}

.section-content-wrapper[data-section-id="tco"] {
  border: 2px solid rgb(251 191 36);
  border-top: none;
}

:deep(.p-datatable-tbody > tr:last-child > td) {
  border-bottom: 2px solid rgb(251 191 36);
}

:deep(.collapsed-by-default .p-datatable-tbody > tr:last-child > td) {
  border-bottom: 1px solid rgb(51 65 85);
}

.tco-section .bg-amber-500 {
  background: white !important;
  color: rgb(251 191 36) !important;
}

.tco-section .bg-amber-500:hover {
  background: rgb(254 252 232) !important;
}

/* Responsive columns */
:deep(.comparison-table .p-datatable-tbody > tr > td:not(:first-child)) {
  min-width: 150px;
}

.comparison-header-grid > div:not(:first-child) {
  min-width: 150px;
}

/* Category headers */
.category-header {
  min-width: 180px !important;
  border-left: 1px solid rgb(51 65 85);
}

/* Scroll horizontal indicators */
.header-scroll-container {
  scrollbar-width: thin;
  scrollbar-color: rgb(251 191 36) rgb(30 41 59);
}

.header-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.header-scroll-container::-webkit-scrollbar-track {
  background: rgb(30 41 59);
  border-radius: 4px;
}

.header-scroll-container::-webkit-scrollbar-thumb {
  background: rgb(251 191 36);
  border-radius: 4px;
}

.header-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgb(245 158 11);
}

.section-scroll-container {
  scrollbar-width: thin;
  scrollbar-color: rgb(251 191 36) rgb(30 41 59);
}

.section-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.section-scroll-container::-webkit-scrollbar-track {
  background: rgb(30 41 59);
  border-radius: 4px;
}

.section-scroll-container::-webkit-scrollbar-thumb {
  background: rgb(251 191 36);
  border-radius: 4px;
}

.section-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgb(245 158 11);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .comparison-header-grid {
    grid-template-columns: 250px repeat(auto-fit, minmax(140px, 1fr));
  }

  :deep(.comparison-table .property-column) {
    width: 250px !important;
    min-width: 250px !important;
    max-width: 250px !important;
  }

  .category-header {
    min-width: 140px !important;
  }

  :deep(.comparison-table .p-datatable-tbody > tr > td:not(:first-child)) {
    min-width: 140px;
  }
}

@media (max-width: 640px) {
  .comparison-header-grid {
    grid-template-columns: 200px repeat(auto-fit, minmax(120px, 1fr));
  }

  :deep(.comparison-table .property-column) {
    width: 200px !important;
    min-width: 200px !important;
    max-width: 200px !important;
  }

  .category-header {
    min-width: 120px !important;
  }

  :deep(.comparison-table .p-datatable-tbody > tr > td:not(:first-child)) {
    min-width: 120px;
  }
}

/* Category filter checkboxes */
:deep(.category-checkbox .p-checkbox-box) {
  background: rgb(75 85 99) !important;
  border: 2px solid rgb(156 163 175) !important;
  border-radius: 6px !important;
  width: 20px !important;
  height: 20px !important;
  transition: all 0.2s ease !important;
}

:deep(.category-checkbox .p-checkbox-box.p-highlight) {
  background: rgb(251 191 36) !important;
  border-color: rgb(251 191 36) !important;
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.2) !important;
}

:deep(.category-checkbox .p-checkbox-box .p-checkbox-icon) {
  color: rgb(30 41 59) !important;
  font-size: 14px !important;
  font-weight: 900 !important;
  stroke-width: 3px !important;
}

:deep(.category-checkbox:not(.p-disabled):hover .p-checkbox-box) {
  border-color: rgb(251 191 36) !important;
  transform: scale(1.05) !important;
}

:deep(.category-checkbox:not(.p-disabled):hover .p-checkbox-box:not(.p-highlight)) {
  background: rgb(107 114 128) !important;
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.1) !important;
}

/* Amélioration des labels */
.category-filter-label {
  font-weight: 500;
  transition: color 0.2s ease;
}

.category-filter-label:hover {
  color: rgb(251 191 36) !important;
}
</style>
