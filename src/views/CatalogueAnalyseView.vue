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
import Dialog from 'primevue/dialog';

// Icons
import { BarChart3, AreaChart, FileSpreadsheet, FileText, Table, Search } from 'lucide-vue-next';

// Services
import { catalogueService } from '@/services/api/catalogueService';

// State
const route = useRoute();
const router = useRouter();
const toast = useToast();

const catalogue = ref(null);
const loading = ref(true);
const displayMode = ref('table'); // 'table' ou 'charts'
const selectedCategories = ref([]);

// Dialog states
const showVehicleDetails = ref(false);
const selectedVehicleDetails = ref(null);

// Scroll sync
const isScrollSyncing = ref(false);
const scrollListeners = ref([]);

// Computed properties
const canDownloadFiles = computed(() => {
  return catalogue.value?.export_pdf || catalogue.value?.export_xls;
});

// Computed pour les catégories disponibles
const availableCategories = computed(() => {
  return catalogue.value?.categories || [];
});

// Computed pour les véhicules organisés par catégorie avec ranking TCO
const vehiclesByCategory = computed(() => {
  if (!catalogue.value?.categories) return [];

  return catalogue.value.categories
    .filter(category => selectedCategories.value.includes(category.uuid))
    .map(category => {
      // Trier les véhicules par TCO mensuel (croissant = meilleur)
      const sortedVehicules = (category.vehicules || [])
        .map(vehicule => ({
          ...vehicule,
          categoryTitle: category.title,
          categoryUuid: category.uuid
        }))
        .sort((a, b) => (a.calcul?.tcoMensuel || 0) - (b.calcul?.tcoMensuel || 0));

      // Ajouter le ranking TCO dans la catégorie
      const vehiculesWithRanking = sortedVehicules.map((vehicule, index) => ({
        ...vehicule,
        tcoRankInCategory: index + 1
      }));

      return {
        ...category,
        vehicules: vehiculesWithRanking,
        tcoMoyenCategorie: calculateCategoryTCOAverage(vehiculesWithRanking)
      };
    });
});

// Computed pour le TCO moyen global
const getTCOMoyenGlobal = computed(() => {
  const allVehicules = getAllVehicules();
  if (!allVehicules.length) return 0;
  const total = allVehicules.reduce((sum, vehicule) => {
    return sum + (vehicule.calcul?.tcoMensuel || 0);
  }, 0);
  return total / allVehicules.length;
});

// Computed pour les colonnes principales (non-collapsées)
const mainColumns = computed(() => [
  {
    field: 'vehicle_info',
    header: 'Véhicule',
    key: 'vehicle_info',
    sortable: false,
    style: 'min-width: 250px'
  },
  {
    field: 'prix_total_remise',
    header: 'Prix Total TTC',
    key: 'prix_total_remise',
    sortable: true,
    style: 'min-width: 120px'
  },
  {
    field: 'loyer_total',
    header: 'Loyer Total',
    key: 'loyer_total',
    sortable: true,
    style: 'min-width: 120px'
  },
  {
    field: 'fiscalite_mensuelle',
    header: 'Fiscalité Mensuelle',
    key: 'fiscalite_mensuelle',
    sortable: true,
    style: 'min-width: 140px'
  },
  {
    field: 'budget_energie_mensuel',
    header: 'Budget Énergie',
    key: 'budget_energie_mensuel',
    sortable: true,
    style: 'min-width: 120px'
  },
  {
    field: 'is_and_value',
    header: 'IS sur AND',
    key: 'is_and_value',
    sortable: true,
    style: 'min-width: 100px'
  },
  {
    field: 'aen_charge',
    header: 'Charges AEN',
    key: 'aen_charge',
    sortable: true,
    style: 'min-width: 120px'
  },
  {
    field: 'tco_mensuel',
    header: 'TCO Mensuel',
    key: 'tco_mensuel',
    sortable: true,
    style: 'min-width: 120px',
    special: 'tco' // Pour le highlighting spécial
  },
  {
    field: 'ecart_tco',
    header: 'Écart TCO',
    key: 'ecart_tco',
    sortable: true,
    style: 'min-width: 120px'
  },
  {
    field: 'prk',
    header: 'PRK /km',
    key: 'prk',
    sortable: true,
    style: 'min-width: 100px'
  },
  {
    field: 'ranking_tco',
    header: 'Ranking TCO',
    key: 'ranking_tco',
    sortable: true,
    style: 'min-width: 120px'
  }
]);

// Methods
const loadCatalogueData = async () => {
  try {
    loading.value = true;
    const uuid = route.params.uuid;

    const response = await catalogueService.getCatalogueAnalyseByUuid(uuid);
    catalogue.value = response.data;

    // Initialiser toutes les catégories comme sélectionnées
    initializeCategories();

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

// Initialiser toutes les catégories comme sélectionnées par défaut
const initializeCategories = () => {
  if (catalogue.value?.categories) {
    selectedCategories.value = catalogue.value.categories.map(cat => cat.uuid);
  }
};

// Récupérer tous les véhicules (filtrés par catégories sélectionnées)
const getAllVehicules = () => {
  const vehicules = [];
  if (!catalogue.value?.categories) return vehicules;

  catalogue.value.categories.forEach(category => {
    if (selectedCategories.value.includes(category.uuid)) {
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

// Calculer le TCO moyen d'une catégorie
const calculateCategoryTCOAverage = (vehicules) => {
  if (!vehicules.length) return 0;
  const total = vehicules.reduce((sum, vehicule) => {
    return sum + (vehicule.calcul?.tcoMensuel || 0);
  }, 0);
  return total / vehicules.length;
};

// Toggle d'une catégorie
const toggleCategory = (categoryUuid) => {
  const index = selectedCategories.value.indexOf(categoryUuid);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(categoryUuid);
  }
};

// Sélectionner/désélectionner toutes les catégories
const toggleAllCategories = () => {
  if (selectedCategories.value.length === catalogue.value?.categories?.length) {
    selectedCategories.value = []; 
  } else {
    selectedCategories.value = catalogue.value?.categories?.map(cat => cat.uuid) || [];
  }
};

// Afficher les détails d'un véhicule dans une popup
const showVehicleDetailsDialog = (vehicule) => {
  // Ajouter le TCO moyen de la catégorie au véhicule sélectionné
  const categoryData = vehiclesByCategory.value.find(cat => cat.uuid === vehicule.categoryUuid);
  selectedVehicleDetails.value = {
    ...vehicule,
    tcoMoyenCategorie: categoryData?.tcoMoyenCategorie || 0
  };
  showVehicleDetails.value = true;
};

// Fonction pour calculer le PRK (comme dans ComparoAnalyseView)
const getPRK = (vehicule) => {
  const kmMensuel = vehicule.calcul?.km_mensuel || 0;
  const tcoMensuel = vehicule.calcul?.tcoMensuel || 0;
  return kmMensuel ? (tcoMensuel / kmMensuel) : 0;
};

// Obtenir la valeur formatée d'une colonne
const getColumnValue = (vehicule, columnField) => {
  switch (columnField) {
    case 'prix_total_remise':
      const prixTotal = (vehicule.prix || 0) + (vehicule.prix_options || 0);
      const remiseDecimal = (vehicule.remise || 0) / 100;
      return formatCurrency(prixTotal * (1 - remiseDecimal));
    case 'loyer_total':
      return formatCurrency(vehicule.calcul?.loyer_total || 0);
    case 'fiscalite_mensuelle':
      return formatCurrency(vehicule.calcul?.fiscalite_mensuel || 0);
    case 'budget_energie_mensuel':
      return formatCurrency(vehicule.calcul?.budget_mensuel_total_energie || 0);
    case 'is_and_value':
      return formatCurrency(vehicule.calcul?.isAnd || 0);
    case 'aen_charge':
      return formatCurrency(vehicule.calcul?.aenChargePatronale || 0);
    case 'tco_mensuel':
      return formatCurrency(vehicule.calcul?.tcoMensuel || 0);
    case 'ecart_tco':
      const categoryData = vehiclesByCategory.value.find(cat => cat.uuid === vehicule.categoryUuid);
      const tcoMoyenCategorie = categoryData?.tcoMoyenCategorie || 0;
      const tcoVehicule = vehicule.calcul?.tcoMensuel || 0;
      const ecart = tcoMoyenCategorie - tcoVehicule;
      return formatCurrency(ecart);
    case 'prk':
      return formatCurrency(getPRK(vehicule));
    case 'ranking_tco':
      return `#${vehicule.tcoRankInCategory || '-'}`;
    default:
      return '-';
  }
};

// Obtenir la classe CSS conditionnelle pour le highlighting
const getColumnClass = (vehicule, columnField) => {
  const value = getColumnRawValue(vehicule, columnField);
  const field = getFieldForMinMax(columnField);
  if (!field) return '';

  const min = getMinValueForCategory(field, vehicule.categoryUuid);
  const max = getMaxValueForCategory(field, vehicule.categoryUuid);

  if (value === min) return 'text-green-400 font-bold';
  if (value === max) return 'text-red-400 font-bold';
  return '';
};

// Obtenir la valeur brute pour les calculs min/max
const getColumnRawValue = (vehicule, columnField) => {
  switch (columnField) {
    case 'prix_total_remise':
      const prixTotal = (vehicule.prix || 0) + (vehicule.prix_options || 0);
      const remiseDecimal = (vehicule.remise || 0) / 100;
      return prixTotal * (1 - remiseDecimal);
    case 'loyer_total':
      return vehicule.calcul?.loyer_total || 0;
    case 'fiscalite_mensuelle':
      return vehicule.calcul?.fiscalite_mensuel || 0;
    case 'budget_energie_mensuel':
      return vehicule.calcul?.budget_mensuel_total_energie || 0;
    case 'is_and_value':
      return vehicule.calcul?.isAnd || 0;
    case 'aen_charge':
      return vehicule.calcul?.aenChargePatronale || 0;
    case 'tco_mensuel':
      return vehicule.calcul?.tcoMensuel || 0;
    case 'ecart_tco':
      const categoryData = vehiclesByCategory.value.find(cat => cat.uuid === vehicule.categoryUuid);
      const tcoMoyenCategorie = categoryData?.tcoMoyenCategorie || 0;
      const tcoVehicule = vehicule.calcul?.tcoMensuel || 0;
      return tcoMoyenCategorie - tcoVehicule;
    case 'prk':
      return getPRK(vehicule);
    default:
      return 0;
  }
};

// Mapping pour les champs min/max
const getFieldForMinMax = (columnField) => {
  const mapping = {
    'prix_total_remise': 'prix_vehicule',
    'loyer_total': 'loyer_total',
    'fiscalite_mensuelle': 'fiscalite',
    'budget_energie_mensuel': 'budget_energie_mensuel',
    'is_and_value': 'is_and_value',
    'aen_charge': 'aen_charge',
    'tco_mensuel': 'tco_mensuel',
    'ecart_tco': 'ecart_tco',
    'prk': 'prk_contrat'
  };
  return mapping[columnField];
};

// Fonctions pour calculs min/max
const getMinValue = (field) => {
  const allVehicules = getAllVehicules();
  if (!allVehicules.length) return Infinity;

  let values = allVehicules.map(vehicule => {
    switch (field) {
      case 'prix_vehicule':
        const prixTotal = (vehicule.prix || 0) + (vehicule.prix_options || 0);
        const remiseDecimal = (vehicule.remise || 0) / 100;
        return prixTotal * (1 - remiseDecimal);
      case 'loyer_total':
        return vehicule.calcul?.loyer_total || 0;
      case 'fiscalite':
        return vehicule.calcul?.fiscalite_mensuel || 0;
      case 'budget_energie_mensuel':
        return vehicule.calcul?.budget_mensuel_total_energie || 0;
      case 'tco_mensuel':
        return vehicule.calcul?.tcoMensuel || 0;
      case 'prk_contrat':
        return getPRK(vehicule);
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
        const prixTotal = (vehicule.prix || 0) + (vehicule.prix_options || 0);
        const remiseDecimal = (vehicule.remise || 0) / 100;
        return prixTotal * (1 - remiseDecimal);
      case 'loyer_total':
        return vehicule.calcul?.loyer_total || 0;
      case 'fiscalite':
        return vehicule.calcul?.fiscalite_mensuel || 0;
      case 'budget_energie_mensuel':
        return vehicule.calcul?.budget_mensuel_total_energie || 0;
      case 'tco_mensuel':
        return vehicule.calcul?.tcoMensuel || 0;
      case 'prk_contrat':
        return getPRK(vehicule);
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

// Fonctions pour calculs min/max par catégorie
const getMinValueForCategory = (field, categoryUuid) => {
  const categoryVehicules = getVehiculesByCategory(categoryUuid);
  if (!categoryVehicules.length) return Infinity;

  let values = categoryVehicules.map(vehicule => {
    switch (field) {
      case 'prix_vehicule':
        const prixTotal = (vehicule.prix || 0) + (vehicule.prix_options || 0);
        const remiseDecimal = (vehicule.remise || 0) / 100;
        return prixTotal * (1 - remiseDecimal);
      case 'loyer_total':
        return vehicule.calcul?.loyer_total || 0;
      case 'fiscalite':
        return vehicule.calcul?.fiscalite_mensuel || 0;
      case 'budget_energie_mensuel':
        return vehicule.calcul?.budget_mensuel_total_energie || 0;
      case 'tco_mensuel':
        return vehicule.calcul?.tcoMensuel || 0;
      case 'ecart_tco':
        const categoryData = vehiclesByCategory.value.find(cat => cat.uuid === categoryUuid);
        const tcoMoyenCategorie = categoryData?.tcoMoyenCategorie || 0;
        const tcoVehicule = vehicule.calcul?.tcoMensuel || 0;
        return tcoMoyenCategorie - tcoVehicule;
      case 'prk_contrat':
        return getPRK(vehicule);
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

const getMaxValueForCategory = (field, categoryUuid) => {
  const categoryVehicules = getVehiculesByCategory(categoryUuid);
  if (!categoryVehicules.length) return -Infinity;

  let values = categoryVehicules.map(vehicule => {
    switch (field) {
      case 'prix_vehicule':
        const prixTotal = (vehicule.prix || 0) + (vehicule.prix_options || 0);
        const remiseDecimal = (vehicule.remise || 0) / 100;
        return prixTotal * (1 - remiseDecimal);
      case 'loyer_total':
        return vehicule.calcul?.loyer_total || 0;
      case 'fiscalite':
        return vehicule.calcul?.fiscalite_mensuel || 0;
      case 'budget_energie_mensuel':
        return vehicule.calcul?.budget_mensuel_total_energie || 0;
      case 'tco_mensuel':
        return vehicule.calcul?.tcoMensuel || 0;
      case 'ecart_tco':
        const categoryData = vehiclesByCategory.value.find(cat => cat.uuid === categoryUuid);
        const tcoMoyenCategorie = categoryData?.tcoMoyenCategorie || 0;
        const tcoVehicule = vehicule.calcul?.tcoMensuel || 0;
        return tcoMoyenCategorie - tcoVehicule;
      case 'prk_contrat':
        return getPRK(vehicule);
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

// Fonction utilitaire pour récupérer les véhicules d'une catégorie spécifique
const getVehiculesByCategory = (categoryUuid) => {
  if (!catalogue.value?.categories) return [];
  
  const category = catalogue.value.categories.find(cat => cat.uuid === categoryUuid);
  return category?.vehicules || [];
};

// Utility functions
const getVehicleLabel = (vehicule) => {
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

// Formatting functions
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-';
  
  // Vérifier si la valeur a des décimales significatives
  const hasDecimals = value % 1 !== 0;
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: hasDecimals ? 2 : 0
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

// Fonction pour convertir les heures décimales en format heures:minutes
const formatHeuresMinutes = (heuresDecimales) => {
  if (!heuresDecimales || !Number.isFinite(heuresDecimales)) {
    return '-';
  }
  const heures = Math.floor(heuresDecimales);
  const minutes = Math.round((heuresDecimales - heures) * 60);
  
  if (minutes === 60) {
    return `${heures + 1}h`;
  }
  if (minutes === 0) {
    return `${heures}h`;
  } else {
    return `${heures}h${minutes.toString().padStart(2, '0')}`;
  }
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

// Fonction pour calculer la ventilation du TCO en pourcentage
const getTCOVentilation = (vehicule, type) => {
  const tcoMensuel = vehicule.calcul?.tcoMensuel || 0;
  if (!tcoMensuel) return 0;

  if (type === 'loyer') {
    const loyerTotal = vehicule.calcul?.loyer_total || 0;
    return Number((loyerTotal / tcoMensuel) * 100).toFixed(2);
  } else if (type === 'fiscalite') {
    const fiscalite = vehicule.calcul?.fiscalite_mensuel || 0;
    return Number((fiscalite / tcoMensuel) * 100).toFixed(2);
  } else if (type === 'carburant') {
    const carburant = vehicule.calcul?.budget_mensuel_total_energie || 0;
    return Number((carburant / tcoMensuel) * 100).toFixed(2);
  } else if (type == 'aenCharge') {
    const aenCharge = vehicule.calcul?.aenChargePatronale || 0;
    return Number((aenCharge / tcoMensuel) * 100).toFixed(2);
  } else if (type == 'isAnd') {
    const isAnd = vehicule.calcul?.isAnd || 0;
    return Number((isAnd / tcoMensuel) * 100).toFixed(2);
  }
  return 0;
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

// Scroll synchronization
const syncScrollPosition = (sourceElement, scrollLeft) => {
  if (isScrollSyncing.value) return;

  isScrollSyncing.value = true;
  

  // Find all sync containers and sync them directly
  const allContainers = document.querySelectorAll('.sync-scroll-container');
  

  // Synchronize all containers except the source
  let syncedCount = 0;
  allContainers.forEach(container => {
    if (container && container !== sourceElement) {
      container.scrollLeft = scrollLeft;
      syncedCount++;
    }
  });
  

  setTimeout(() => {
    isScrollSyncing.value = false;
  }, 10);
};

const attachScrollListeners = () => {
  cleanupScrollListeners();

  nextTick(() => {
    setTimeout(() => {
      // Simplified approach: attach to all containers directly
      const syncContainers = document.querySelectorAll('.sync-scroll-container');
      
      syncContainers.forEach((container, index) => {
        
        const scrollHandler = (e) => {
          syncScrollPosition(e.target, e.target.scrollLeft);
        };
        
        container.addEventListener('scroll', scrollHandler, { passive: true });
        scrollListeners.value.push({
          element: container,
          handler: scrollHandler
        });
        
        
        // Log container dimensions
      });
      
    }, 100); // Reduced timeout
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

// Watchers pour re-attacher les scroll listeners
watch(vehiclesByCategory, () => {
  setTimeout(attachScrollListeners, 300);
}, { deep: true });

watch(selectedCategories, () => {
  if (catalogue.value) {
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
                          {{ selectedCategories.length === availableCategories.length ? 'Tout désélectionner' : 'Tout sélectionner' }}
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
                            v-model="selectedCategories"
                            :value="category.uuid"
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

              <!-- Nouveau tableau horizontal -->
              <div v-if="displayMode === 'table'" class="mt-6">
                <div class="rounded-lg overflow-hidden">
                  <div class="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                    <h3 class="text-white font-bold text-lg flex items-center gap-2">
                      <Table class="w-5 h-5" />
                      Analyse comparative des véhicules
                    </h3>
                  </div>
                  
                  <!-- Tableau par catégorie -->
                  <div v-for="categoryData in vehiclesByCategory" :key="categoryData.uuid" class="mb-8">
                    <!-- Header de catégorie -->
                    <div class="bg-surface-800 p-3 border-b border-surface-700">
                      <h4 class="text-white font-semibold text-md flex items-center gap-2">
                        <span class="w-4 h-4 bg-amber-500 rounded-full"></span>
                        {{ categoryData.title }}
                        <span class="text-sm text-gray-400 ml-2">({{ categoryData.vehicules?.length || 0 }} véhicules)</span>
                        <span class="text-sm text-amber-400 ml-4">TCO moyen : {{ formatCurrency(categoryData.tcoMoyenCategorie) }}</span>
                      </h4>
                    </div>

                    <!-- Tableau des véhicules de la catégorie -->
                    <div class="overflow-x-auto sync-scroll-container bg-white rounded-lg w-full">
                      <div style="width: 1800px; min-width: 1800px;">
                        <DataTable
                          :value="categoryData.vehicules"
                          class="horizontal-comparison-table"
                          :scrollable="false"
                          tableStyle="width: 1800px; min-width: 1800px;"
                        >
                        <!-- Colonne actions avec loupe -->
                        <Column style="width: 60px" :frozen="true">
                          <template #header>
                            <div class="text-center text-white font-medium text-xs">
                              Détails
                            </div>
                          </template>
                          <template #body="slotProps">
                            <button 
                              @click="showVehicleDetailsDialog(slotProps.data)"
                              class="action-btn flex items-center justify-center w-6 h-6 bg-amber-500 hover:bg-amber-600 rounded transition-colors mx-auto"
                              title="Voir les détails"
                            >
                              <Search class="w-3 h-3 text-white" />
                            </button>
                          </template>
                        </Column>

                        <!-- Colonnes principales -->
                        <Column 
                          v-for="column in mainColumns" 
                          :key="column.key"
                          :field="column.field"
                          :header="column.header"
                          :sortable="column.sortable"
                          :style="column.style || 'min-width: 150px; width: 150px;'"
                          :frozen="column.key === 'vehicle_info'"
                          :class="column.special === 'tco' ? 'tco-column' : ''"
                        >
                          <template #body="slotProps">
                            <div 
                              v-if="column.key === 'vehicle_info'"
                              class="vehicle-info-cell cursor-pointer hover:text-amber-400 transition-colors"
                              @click="showVehicleDetailsDialog(slotProps.data)"
                            >
                              <div class="font-medium text-sm">{{ getVehicleLabel(slotProps.data) }}</div>
                              <div class="text-xs text-gray-400 mt-1">{{ slotProps.data.loueur?.name || '' }}</div>
                            </div>
                            <div 
                              v-else
                              class="text-center font-medium"
                              :class="getColumnClass(slotProps.data, column.field)"
                            >
                              {{ getColumnValue(slotProps.data, column.field) }}
                            </div>
                          </template>
                        </Column>
                        </DataTable>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mode graphiques (placeholder pour l'instant) -->
              <div v-else class="mt-6">
                <Card class="text-center p-8">
                  <AreaChart class="w-16 h-16 mx-auto text-amber-500 mb-4" />
                  <h3 class="text-xl font-bold mb-2">Mode Graphiques</h3>
                  <p class="text-gray-600">Les graphiques seront implémentés dans une prochaine version.</p>
                </Card>
              </div>

              <!-- Retour -->
              <div class="flex justify-start mt-6">
                <Button @click="router.push('/catalogues')" class="btn-primary w-[200px] min-w-[200px]">
                  Retour aux catalogues
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog pour les détails du véhicule -->
    <Dialog 
      v-model:visible="showVehicleDetails" 
      modal 
      dismissableMask
      :header="`Détails - ${selectedVehicleDetails ? getVehicleLabel(selectedVehicleDetails) : ''}`"
      :style="{ width: '95vw', maxWidth: '1000px', maxHeight: '90vh' }"
      class="vehicle-details-dialog"
    >
      <div v-if="selectedVehicleDetails" class="vehicle-details-content">
        <!-- Section Informations véhicule -->
        <div class="detail-section">
          <h3 class="section-header">📋 Informations véhicule</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Marque</span>
              <span class="info-value">{{ selectedVehicleDetails.marque?.name || selectedVehicleDetails.marque || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Modèle</span>
              <span class="info-value">{{ selectedVehicleDetails.modele?.title || selectedVehicleDetails.modele || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Moteur/Finition</span>
              <span class="info-value">{{ selectedVehicleDetails.modele?.moteur || selectedVehicleDetails.finition || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Type fiscal</span>
              <span class="info-value">{{ selectedVehicleDetails.type_fisc?.toUpperCase() || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Énergie</span>
              <span class="info-value">{{ selectedVehicleDetails.energie?.toUpperCase() || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Consommation carburant</span>
              <span class="info-value">{{ selectedVehicleDetails.conso_carb ? `${formatNumber(selectedVehicleDetails.conso_carb, 1)} L/100km` : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Consommation kWh</span>
              <span class="info-value">{{ selectedVehicleDetails.conso_kwh ? `${formatNumber(selectedVehicleDetails.conso_kwh, 1)} kWh/100km` : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Émission CO2 WLTP</span>
              <span class="info-value">{{ selectedVehicleDetails.co2 ? `${selectedVehicleDetails.co2} g/km` : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Poids véhicule (PVOM)</span>
              <span class="info-value">{{ selectedVehicleDetails.pvom ? `${selectedVehicleDetails.pvom} kg` : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Autonomie batterie (WLTP)</span>
              <span class="info-value">{{ selectedVehicleDetails.modele?.autonomie ? `${selectedVehicleDetails.modele.autonomie} km` : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Capacité de la batterie</span>
              <span class="info-value">{{ selectedVehicleDetails.capacite_batterie ? `${selectedVehicleDetails.capacite_batterie} kWh` : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Capacité de recharge</span>
              <span class="info-value">{{ selectedVehicleDetails.vitesse_recharge_batterie ? `${selectedVehicleDetails.vitesse_recharge_batterie} kW` : '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Section Prix -->
        <div class="detail-section">
          <h3 class="section-header">💰 Informations tarifaires</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Prix du véhicule non remisé</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.prix || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Montant option(s) non remisé</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.prix_options || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Prix total avec options</span>
              <span class="info-value highlight">{{ formatCurrency(getPrixTotal(selectedVehicleDetails)) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Remise en %</span>
              <span class="info-value">{{ formatPercent(selectedVehicleDetails.remise || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Prix remisé TTC</span>
              <span class="info-value highlight">{{ formatCurrency(getPrixRemise(selectedVehicleDetails)) }}</span>
            </div>
          </div>
        </div>

        <!-- Section Contrat -->
        <div class="detail-section">
          <h3 class="section-header">📄 Contrat</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Loyer Financier</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.loyer_financier || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Entretien</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.entretien || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Pneumatiques</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.pneumatique || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gardiennage des pneumatiques</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.pneumatique_garde || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Véhicule Relais</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.vehicule_relais || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Assurance RC</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.assurance_rc || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Assurance Dommages</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.assurance_dommage || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Perte Financière</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.perte_fi || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Carte(s) Carburant</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.carte_carb || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Carte électrique</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.carte_elec || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Badge Télépéage</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.badge_telepeage || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Pastille Crit'Air</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.vignette_critair || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Autre coût</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.autre_cout || 0) }}</span>
            </div>
            <div class="info-item special">
              <span class="info-label">Loyer total</span>
              <span class="info-value highlight">{{ formatCurrency(selectedVehicleDetails.calcul?.loyer_total || 0) }}</span>
            </div>
            <div class="info-item special">
              <span class="info-label">PRK /km</span>
              <span class="info-value highlight">{{ formatCurrency(selectedVehicleDetails.calcul?.prk || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Section Fiscalité -->
        <div class="detail-section">
          <h3 class="section-header">🏛️ Fiscalité</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Malus CO² (une fois)</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.calcul?.malus_co2 || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Taxe CO² (annuelle)</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.calcul?.taxe_co2 || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Taxe polluants (annuelle)</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.calcul?.taxe_polluant || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Taxe à la masse (une fois)</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.calcul?.taxe_masse || 0) }}</span>
            </div>
            <div class="info-item special">
              <span class="info-label">Fiscalité mensuelle</span>
              <span class="info-value highlight">{{ formatCurrency(selectedVehicleDetails.calcul?.fiscalite_mensuel || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Section Énergie -->
        <div class="detail-section">
          <h3 class="section-header">⚡ Énergie</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Prix de l'énergie Thermique €</span>
              <span class="info-value">{{ selectedVehicleDetails.calcul?.prix_energie_thermique ? formatCurrency(selectedVehicleDetails.calcul.prix_energie_thermique) : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Prix de l'énergie Électrique €</span>
              <span class="info-value">{{ selectedVehicleDetails.calcul?.prix_energie_electrique ? formatCurrency(selectedVehicleDetails.calcul.prix_energie_electrique) : '-' }}</span>
            </div>
            <div class="info-item special">
              <span class="info-label">Budget énergie mensuel</span>
              <span class="info-value highlight">{{ formatCurrency(selectedVehicleDetails.calcul?.budget_mensuel_total_energie || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Section IS sur AND -->
        <div class="detail-section">
          <h3 class="section-header">🏢 IS sur AND</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">% d'imposition Client (IS)</span>
              <span class="info-value">{{ formatPercent(catalogue?.is || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Plafond d'AND</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.calcul?.plafondAnd || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Calcul AND Mensuel</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.calcul?.andMensuel || 0) }}</span>
            </div>
            <div class="info-item special">
              <span class="info-label">IS sur AND</span>
              <span class="info-value highlight">{{ formatCurrency(selectedVehicleDetails.calcul?.isAnd || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Section AEN -->
        <div class="detail-section">
          <h3 class="section-header">👥 AEN</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Taux AEN</span>
              <span class="info-value">{{ formatPercent(selectedVehicleDetails.aen || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">AEN Mensuel</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.calcul?.aenMensuel || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Taux charges patronales</span>
              <span class="info-value">{{ formatPercent(selectedVehicleDetails.chargePatronale || 0) }}</span>
            </div>
            <div class="info-item special">
              <span class="info-label">Charges patronales sur AEN</span>
              <span class="info-value highlight">{{ formatCurrency(selectedVehicleDetails.calcul?.aenChargePatronale || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Section TCO -->
        <div class="detail-section tco-section">
          <h3 class="section-header">🎯 TCO</h3>
          <div class="info-grid">
            <div class="info-item special">
              <span class="info-label">TCO mensuel</span>
              <span class="info-value tco-highlight">{{ formatCurrency(selectedVehicleDetails.calcul?.tcoMensuel || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">TCO moyen global</span>
              <span class="info-value">{{ formatCurrency(getTCOMoyenGlobal) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">TCO moyen catégorie</span>
              <span class="info-value">{{ formatCurrency(selectedVehicleDetails.tcoMoyenCategorie || 0) }}</span>
            </div>
            <div class="info-item special">
              <span class="info-label">PRK /km</span>
              <span class="info-value highlight">{{ formatCurrency(getPRK(selectedVehicleDetails)) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">TCO Total (durée du contrat)</span>
              <span class="info-value">{{ formatCurrency(getTCOTotal(selectedVehicleDetails)) }}</span>
            </div>
            <div class="info-item ranking">
              <span class="info-label">Ranking TCO</span>
              <span class="info-value ranking-badge">#{{ selectedVehicleDetails.tcoRankInCategory || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Section Ventilation TCO -->
        <div class="detail-section">
          <h3 class="section-header">📊 Ventilation TCO</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Loyer et services (en %)</span>
              <span class="info-value">{{ formatPercent(getTCOVentilation(selectedVehicleDetails, 'loyer')) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Fiscalité (en %)</span>
              <span class="info-value">{{ formatPercent(getTCOVentilation(selectedVehicleDetails, 'fiscalite')) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Carburant (en %)</span>
              <span class="info-value">{{ formatPercent(getTCOVentilation(selectedVehicleDetails, 'carburant')) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Charges sur AEN (en %)</span>
              <span class="info-value">{{ formatPercent(getTCOVentilation(selectedVehicleDetails, 'aenCharge')) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">IS sur AND (en %)</span>
              <span class="info-value">{{ formatPercent(getTCOVentilation(selectedVehicleDetails, 'isAnd')) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
/* Animation pour l'apparition */
.animate-slide-in-up {
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Loading */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-card {
  text-align: center;
  padding: 2rem;
  background: rgb(30 41 59);
  border-radius: 1rem;
  color: white;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  margin-bottom: 1rem;
}

.loading-text {
  color: rgb(203 213 225);
  margin: 0;
}

/* Header */
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, rgb(15 23 42) 0%, rgb(30 41 59) 100%);
  padding: 1rem;
}

.page-content {
  max-width: 100%;
  margin: 0 auto;
}

.content-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-card {
  background: linear-gradient(135deg, rgb(30 41 59) 0%, rgb(51 65 85) 100%);
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.section-header {
  padding: 2rem;
  background: linear-gradient(135deg, rgb(30 41 59) 0%, rgb(51 65 85) 100%);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
}

.section-icon {
  width: 2rem;
  height: 2rem;
  color: rgb(251 191 36);
}

.section-content {
  background: rgb(30 41 59);
}

/* Mode toggle styling */
.mode-toggle-switch {
  margin: 0 1rem;
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

.export-excel {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
}

.export-pdf {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
}

/* Nouveau tableau horizontal */
:deep(.horizontal-comparison-table) {
  background: rgb(30 41 59);
  min-width: 1800px !important;
  width: 1800px !important;
}

:deep(.horizontal-comparison-table .p-datatable-wrapper) {
  min-width: 1800px !important;
  width: 1800px !important;
}

:deep(.horizontal-comparison-table table) {
  min-width: 1800px !important;
  width: 1800px !important;
  table-layout: fixed !important;
}

:deep(.horizontal-comparison-table .p-datatable-thead > tr > th) {
  background: rgb(51 65 85) !important;
  color: white !important;
  border: 1px solid rgb(75 85 99) !important;
  padding: 0.75rem 0.5rem !important;
  text-align: center !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
}

:deep(.horizontal-comparison-table .p-datatable-tbody > tr > td) {
  background: rgb(30 41 59) !important;
  color: white !important;
  border: 1px solid rgb(51 65 85) !important;
  padding: 0.75rem 0.5rem !important;
  vertical-align: middle !important;
}

:deep(.horizontal-comparison-table .p-datatable-tbody > tr:hover > td) {
  background: rgb(51 65 85) !important;
}

/* Colonne TCO mise en avant */
:deep(.horizontal-comparison-table .tco-column th) {
  border: 2px solid rgb(251 191 36) !important;
  background: rgb(251 191 36) !important;
  color: rgb(30 41 59) !important;
  font-weight: 700 !important;
}

:deep(.horizontal-comparison-table .tco-column td) {
  border: 2px solid rgb(251 191 36) !important;
  background: rgb(45 55 72) !important;
}

/* Action button */
.action-btn {
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
}

/* Vehicle info cell */
.vehicle-info-cell {
  min-width: 200px !important;
  max-width: 250px !important;
  overflow: hidden !important;
  width: 250px !important;
}

.vehicle-info-cell > div {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  max-width: 100% !important;
}

/* Force column width for vehicle info - target by position */
:deep(.horizontal-comparison-table td:nth-child(2)) {
  max-width: 250px !important;
  width: 250px !important;
  overflow: hidden !important;
}

:deep(.horizontal-comparison-table th:nth-child(2)) {
  max-width: 250px !important;
  width: 250px !important;
}

/* Additional fallback styles */
:deep(.horizontal-comparison-table) td[style*="min-width: 250px"] {
  max-width: 250px !important;
  width: 250px !important;
  overflow: hidden !important;
}

/* TCO Column highlighting - encadré complet colonne 9 */
:deep(.horizontal-comparison-table th:nth-child(9)) {
  background: rgba(251, 191, 36, 0.1) !important;
  box-shadow: 
    inset 4px 0 0 rgb(251 191 36), 
    inset -4px 0 0 rgb(251 191 36), 
    inset 0 4px 0 rgb(251 191 36) !important;
  font-weight: bold !important;
  color: rgb(251 191 36) !important;
}

:deep(.horizontal-comparison-table td:nth-child(9)) {
  background: rgba(251, 191, 36, 0.05) !important;
  box-shadow: inset 4px 0 0 rgb(251 191 36), inset -4px 0 0 rgb(251 191 36) !important;
}

/* Bordure basse pour la dernière ligne de chaque catégorie */
:deep(.horizontal-comparison-table tr:last-child td:nth-child(9)) {
  box-shadow: 
    inset 4px 0 0 rgb(251 191 36), 
    inset -4px 0 0 rgb(251 191 36), 
    inset 0 -4px 0 rgb(251 191 36) !important;
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
}

.category-filter-label {
  font-weight: 500;
  transition: color 0.2s ease;
}

.category-filter-label:hover {
  color: rgb(251 191 36) !important;
}

/* Dialog styles */
:deep(.vehicle-details-dialog .p-dialog-header) {
  background: rgb(30 41 59);
  color: white;
  border-bottom: 2px solid rgb(251 191 36);
  font-weight: 600;
}

:deep(.vehicle-details-dialog .p-dialog-content) {
  background: rgb(30 41 59);
  color: white;
  padding: 0;
}

.vehicle-details-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 1.5rem;
}

.detail-section {
  background: rgb(51 65 85);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgb(75 85 99);
}

.detail-section.tco-section {
  border: 2px solid rgb(251 191 36);
  background: linear-gradient(135deg, rgb(51 65 85), rgb(45 55 72));
}

.section-header {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(251 191 36);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgb(75 85 99);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgb(30 41 59);
  border-radius: 8px;
  border: 1px solid rgb(75 85 99);
  transition: all 0.2s ease;
}

.info-item:hover {
  background: rgb(45 55 72);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.info-item.special {
  border: 2px solid rgb(251 191 36);
  background: rgb(45 55 72);
}

.info-item.ranking {
  border: 2px solid rgb(34 197 94);
  background: linear-gradient(135deg, rgb(45 55 72), rgb(34 197 94, 0.1));
}

.info-label {
  font-weight: 500;
  color: rgb(203 213 225);
  font-size: 0.875rem;
  flex: 1;
  margin-right: 1rem;
}

.info-value {
  font-weight: 600;
  color: white;
  text-align: right;
  font-size: 0.875rem;
}

.info-value.highlight {
  color: rgb(251 191 36);
  font-weight: 700;
}

.info-value.tco-highlight {
  color: rgb(251 191 36);
  font-weight: 800;
  font-size: 1.125rem;
}

.ranking-badge {
  background: rgb(34 197 94);
  color: rgb(30 41 59);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 800;
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .info-label {
    margin-right: 0;
  }
  
  .info-value {
    text-align: left;
  }
  
  .export-text {
    display: none;
  }
  
  .vehicle-details-content {
    padding: 1rem;
  }
}
</style>