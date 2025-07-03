<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import ProgressSpinner from 'primevue/progressspinner';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Panel from 'primevue/panel';

import { comparoService } from '@/services/api/comparoService';
import { BarChart3 } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const loading = ref(true);
const comparo = ref(null);
const expandedSections = ref(new Set());
const headerScrollContainer = ref(null);
const isScrollSyncing = ref(false);

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
      case 'prk_contrat': return vehicule.calcul?.prk || 0;
      case 'is_and': return vehicule.calcul?.isAnd || 0;
      case 'charges_patronales_aen': return vehicule.calcul?.aenChargePatronale || 0;
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
      case 'prk_contrat': return vehicule.calcul?.prk || 0;
      case 'is_and': return vehicule.calcul?.isAnd || 0;
      case 'charges_patronales_aen': return vehicule.calcul?.aenChargePatronale || 0;
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
        { id: 'loueur', name: 'Loueur', getValue: (v) => v.loueur?.name || '-' },
        { id: 'marque', name: 'Marque', getValue: (v) => v.marque?.name || '-' },
        { id: 'modele', name: 'Modèle', getValue: (v) => v.modele?.title || '-' },
        { id: 'moteur_finition', name: 'Moteur/Finition', getValue: (v) => v.modele?.moteur ? v.modele?.moteur : v.finition || '-' },
        {id: 'type_fisc', name: 'Type fiscal', getValue: (v) => v.type_fisc?.toUpperCase() || '-'},
        { id: 'energie', name: 'Énergie', getValue: (v) => v.energie?.toUpperCase() || '-' },
        //{ id: 'puissance', name: 'Puissance', getValue: (v) => v.puissance ? `${v.puissance} ch` : '-' },
        //{ id: 'puissance_kw', name: 'Puissance KW', getValue: (v) => getPuissanceKW(v.puissance) ? `${getPuissanceKW(v.puissance)} kW` : '-' },
        { id: 'autonomie', name: 'Autonomie batterie (WLTP)', getValue: (v) => v.modele?.autonomie ? `${v.modele?.autonomie} km` : '-' },
        { id: 'conso_carb', name: 'Consommation carburant', getValue: (v) => v.conso_carb ? `${formatNumber(v.conso_carb, 1)} L/100km` : '-' },
        { id: 'conso_kwh', name: 'Consommation kwh', getValue: (v) => v.conso_kwh ? `${formatNumber(v.conso_kwh, 1)} kWh/100km` : '-' },
        { id: 'co2', name: 'Émission CO2 WLTP', getValue: (v) => v.co2 ? `${v.co2} g/km` : '-' },
        { id: 'poids', name: 'Poids véhicule (PVOM)', getValue: (v) => v.pvom ? `${v.pvom} kg` : '-' },
        { id: 'capacite_batterie', name: 'Capacité de la batterie', getValue: (v) => v.capacite_batterie ? `${v.capacite_batterie} kWh` : '-' },
        { id: 'vitesse_recharge', name: 'Capacité de recharge de la batterie', getValue: (v) => v.vitesse_recharge_batterie ? `${v.vitesse_recharge_batterie} kW` : '-' },
        { id: 'prix', name: 'Prix du véhicule non remisé', getValue: (v) => formatCurrency(v.prix) },
        { id: 'prix_options', name: 'Montant option(s) non remisé', getValue: (v) => formatCurrency(v.prix_options) },
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
        { id: 'loyer_financier', name: 'Loyer Financier', getValue: (v) => formatCurrency(v.loyer_financier) },
        { id: 'entretien', name: 'Entretien', getValue: (v) => formatCurrency(v.entretien) },
        { id: 'pneumatiques', name: 'Pneumatiques', getValue: (v) => formatCurrency(v.pneumatique) },
        { id: 'gardiennage_pneumatiques', name: 'Gardiennage des pneumatiques', getValue: (v) => formatCurrency(v.pneumatique_garde) },
        { id: 'vehicule_relais', name: 'Véhicule Relais', getValue: (v) => formatCurrency(v.vehicule_relais) },
        { id: 'assurance_rc', name: 'Assurance RC', getValue: (v) => formatCurrency(v.assurance_rc) },
        { id: 'assurance_dommages', name: 'Assurance Dommages', getValue: (v) => formatCurrency(v.assurance_dommage) },
        { id: 'perte_financiere', name: 'Perte Financière', getValue: (v) => formatCurrency(v.perte_fi) },
        { id: 'carte_carburant', name: 'Carte (s) Carburant', getValue: (v) => formatCurrency(v.carte_carb) },
        { id: 'carte_electrique', name: 'Carte électrique', getValue: (v) => formatCurrency(v.carte_elec) },
        { id: 'badge_telepeage', name: 'Badge Télépéage', getValue: (v) => formatCurrency(v.badge_telepeage) },
        { id: 'pastille_critair', name: 'Pastille Crit\'Air', getValue: (v) => formatCurrency(v.vignette_critair) },
        { id: 'autre_cout', name: 'Autre coût', getValue: (v) => formatCurrency(v.autre_cout) },
        { id: 'loyer_total', name: 'Loyer total',
          getValue: (v) => formatCurrency(v.calcul?.loyer_total),
          field: 'loyer',
          getClass: (v) => getCellClass(v.calcul?.loyer_total, 'loyer') },
        { id: 'prk_contrat', name: 'PRK /km',
          getValue: (v) => formatCurrency(v.calcul?.prk),
          field: 'prk_contrat',
          getClass: (v) => getCellClass(v.calcul?.prk, 'prk_contrat') }
      ]
    },
    {
      id: 'fiscalite',
      title: 'Fiscalité',
      rows: [
        { id: 'malus_co2', name: 'Malus CO² (une fois)', getValue: (v) => formatCurrency(v.calcul?.malus_co2) },
        { id: 'taxe_co2', name: 'Taxe C0² (annuelle)', getValue: (v) => formatCurrency(v.calcul?.taxe_co2) },
        { id: 'taxe_polluant', name: 'Taxe polluants (annuelle)', getValue: (v) => formatCurrency(v.calcul?.taxe_polluant) },
        { id: 'taxe_masse', name: 'Taxe à la masse (une fois)', getValue: (v) => formatCurrency(v.calcul?.taxe_masse) },
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
        { id: 'energie_thermique', name: 'Prix de l\'énergie Thermique €', getValue: (v) => v.calcul?.prix_energie_thermique ? formatCurrency(v.calcul.prix_energie_thermique) : '-' },
        { id: 'energie_electrique', name: 'Prix de l\'énergie Electrique €', getValue: (v) => v.calcul?.prix_energie_electrique ? formatCurrency(v.calcul.prix_energie_electrique) : '-' },
        { id: 'carburant_mensuel', name: 'Budget énergie mensuel',
          getValue: (v) => formatCurrency(v.calcul?.budget_mensuel_total_energie),
          field: 'carburant',
          getClass: (v) => getCellClass(v.calcul?.budget_mensuel_total_energie, 'carburant') }
      ]
    },
    {
      id: 'is_and',
      title: 'IS sur AND',
      rows: [
        { id: 'pct_imposition_client', name: '% d\'imposition Client (IS)', getValue: (v) => formatPercent(comparo.value?.is) },
        { id: 'plafond_and', name: 'Plafond d\'AND', getValue: (v) => formatCurrency(v.calcul?.plafondAnd) },
        { id: 'calcul_and_mensuel', name: 'Calcul AND Mensuel', getValue: (v) => formatCurrency(v.calcul?.andMensuel) },
        { id: 'is_and_value', name: 'IS sur AND',
          getValue: (v) => formatCurrency(v.calcul?.isAnd),
          field: 'is_and',
          getClass: (v) => getCellClass(v.calcul?.isAnd, 'is_and') }
      ]
    },
    {
      id: 'aen_details',
      title: 'AEN',
      rows: [
        { id: 'taux_aen', name: 'Taux AEN', getValue: (v) => formatPercent(v.aen) },
        { id: 'aen_mensuel_detail', name: 'AEN Mensuel', getValue: (v) => formatCurrency(v.calcul?.aenMensuel) },
        { id: 'taux_charges_patronales', name: 'Taux charges patronales', getValue: (v) => formatPercent(v.chargePatronale) },
        { id: 'charges_patronales_aen', name: 'Charges patronales sur AEN',
          getValue: (v) => formatCurrency(v.calcul?.aenChargePatronale),
          field: 'charges_patronales_aen',
          getClass: (v) => getCellClass(v.calcul?.aenChargePatronale, 'charges_patronales_aen') }
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
        { id: 'tco_carburant', name: 'Carburant (en %)', getValue: (v) => formatPercent(getTCOVentilation(v, 'carburant')) },
        { id: 'aen_charge', name: 'Charges sur AEN (en %)', getValue: (v) => formatPercent(getTCOVentilation(v, 'aenCharge')) },
        { id: 'is_and', name: 'IS sur AND (en %)', getValue: (v) => formatPercent(getTCOVentilation(v, 'isAnd')) }
      ]
    }
  ];

  // Structurer les données pour le DataTable
  const tableData = [];

  sectionsConfig.value = sections;

  // Créer les données pour chaque section séparément
  const sectionDataMap = {};

  sections.forEach(section => {
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
      comparo.value.vehicules.forEach((vehicule, index) => {
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
      allRows: [...coloredRows, ...nonColoredRows]
    };
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

// Fonction pour synchroniser le scroll de tous les conteneurs
const syncScrollPosition = (sourceElement, scrollLeft) => {
  if (isScrollSyncing.value) return;

  isScrollSyncing.value = true;

  // Synchroniser l'en-tête original
  if (headerScrollContainer.value && sourceElement !== headerScrollContainer.value) {
    headerScrollContainer.value.scrollLeft = scrollLeft;
  }

  // Synchroniser toutes les sections
  const allSectionContainers = document.querySelectorAll('.section-scroll-container');
  allSectionContainers.forEach(container => {
    if (container !== sourceElement) {
      container.scrollLeft = scrollLeft;
    }
  });

  // Reset flag après un court délai pour éviter les boucles infinies
  setTimeout(() => {
    isScrollSyncing.value = false;
  }, 10);
};


// Fonction pour attacher les événements de scroll
const attachScrollListeners = () => {
  // Écouteur pour l'en-tête original
  if (headerScrollContainer.value) {
    headerScrollContainer.value.addEventListener('scroll', (e) => {
      syncScrollPosition(e.target, e.target.scrollLeft);
    });
  }

  // Écouteurs pour toutes les sections
  const allSectionContainers = document.querySelectorAll('.section-scroll-container');

  allSectionContainers.forEach((container) => {
    container.addEventListener('scroll', (e) => {
      syncScrollPosition(e.target, e.target.scrollLeft);
    });
  });
};

onMounted(() => {
  loadComparoData();
});

// Attacher les écouteurs après le rendu des données
watch(comparo, (newComparo) => {
  if (newComparo) {
    nextTick(() => {
      // Délai supplémentaire pour être sûr que tout est rendu
      setTimeout(() => {
        attachScrollListeners();
      }, 100);
    });
  }
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
              <BarChart3 class="title-icon" />
              Analyse du comparo
            </h1>
            <p class="page-subtitle">Résultats détaillés de votre comparaison de véhicules</p>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <ProgressSpinner class="loading-spinner" />
          <p class="loading-text">Chargement de l'analyse...</p>
        </div>
      </div>


      <!-- Contenu principal -->
      <div v-else-if="comparo" class="content-grid animate-slide-in-up">
        <!-- Section d'analyse complète -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <BarChart3 class="section-icon" />
              <div class="flex flex-col gap-3 flex-1">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h2 class="text-2xl font-bold">{{ comparo.title }}</h2>
                    <div class="flex flex-wrap gap-2">
                      <div class="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {{ comparo.duree || 0 }} mois
                      </div>
                      <div class="inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        {{ comparo.km ? (comparo.km / 1000).toLocaleString('fr-FR') + ' 000 km' : '0 km' }}
                      </div>
                    </div>
                  </div>
                  <!-- Boutons d'action alignés à droite -->
                  <div class="flex gap-2">
                    <Button
                      severity="success"
                      @click="downloadExcel"
                      class="btn-primary"
                      size="small"
                    >
                      Exporter les données
                    </Button>
                    <Button
                      severity="info"
                      @click="downloadPDF"
                      class="btn-primary"
                      size="small"
                    >
                      Télécharger l'analyse
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="section-content">
            <div class="p-3">
              <!-- En-tête avec véhicules -->
              <div class="comparison-header-sticky border-0 shadow-sm mb-3 rounded-lg overflow-x-auto header-scroll-container" ref="headerScrollContainer">
                <div class="comparison-header-grid gap-0" :style="`--total-columns: ${comparo.vehicules.length + 1}`">
                  <div class="header-criteria bg-surface-900 p-2 font-medium text-white border-0 text-sm flex items-center">

                  </div>
                  <div
                    v-for="(vehicule, index) in comparo.vehicules"
                    :key="'header_'+vehicule.id"
                    class="bg-surface-900 text-center p-2 border-0 hover:bg-surface-800 transition-all duration-200 flex flex-col justify-center items-center"
                  >
                    <div class="font-medium text-white text-xs">{{ vehicule?.marque?.name }}</div>
                    <div class="text-xs text-gray-300">{{ vehicule?.modele?.title }}</div>
                    <div class="text-xs text-blue-400 font-medium">{{ vehicule?.modele?.moteur ? vehicule?.modele?.moteur : vehicule?.finition }}</div>
                  </div>
                </div>
              </div>

              <!-- Sections d'analyse -->
              <div class="space-y-4 sections-container">
                <div v-for="section in sectionsConfig" :key="section.id" class="section-wrapper mb-4">
                  <!-- Header de section -->
                  <div class="section-header-custom bg-surface-900 p-3 border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-t-lg"
                       :class="{ 'cursor-pointer': sectionsData[section.id]?.hasNonColoredRows }"
                       @click="sectionsData[section.id]?.hasNonColoredRows && toggleSection(section.id)">
                    <div class="flex items-center gap-2 w-full">
                      <span class="font-medium text-white text-lg">{{ section.title }}</span>
                      <div v-if="sectionsData[section.id]?.hasNonColoredRows" class="ml-auto flex items-center gap-2">
                        <span class="text-xs text-gray-300 hidden sm:inline">
                          {{ expandedSections.has(section.id) ? 'Cliquez ici pour masquer' : 'Cliquez ici pour voir plus' }}
                        </span>
                        <div class="bg-orange-400 hover:bg-orange-300 rounded-full p-2 transition-all duration-200 transform hover:scale-110 shadow-lg">
                          <svg
                            class="w-4 h-4 text-white transition-transform duration-300"
                            :class="{ 'rotate-180': expandedSections.has(section.id) }"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2.5"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Contenu de section -->
                  <div class="bg-transparent rounded-b-lg shadow-sm overflow-x-auto section-content-wrapper section-scroll-container" :data-section-id="section.id">
                    <!-- Lignes non colorées (affichées seulement si section ouverte) -->
                    <transition
                      name="collapse"
                      enter-active-class="collapse-enter-active"
                      leave-active-class="collapse-leave-active"
                      enter-from-class="collapse-enter-from"
                      enter-to-class="collapse-enter-to"
                      leave-from-class="collapse-leave-from"
                      leave-to-class="collapse-leave-to"
                    >
                      <DataTable
                        v-if="sectionsData[section.id]?.hasNonColoredRows && expandedSections.has(section.id)"
                        :value="sectionsData[section.id].nonColoredRows"
                        class="comparison-table comparison-animate-load"
                        size="small"
                        :showHeaders="false"
                        :rowHover="true"
                        :style="`--total-columns: ${comparo.vehicules.length + 1}`"
                      >
                        <!-- Colonne pour le nom des propriétés -->
                        <Column
                          field="label"
                          class="property-column"
                        >
                          <template #body="{ data }">
                            <div class="font-medium text-white py-1 text-sm flex items-center h-10">
                              {{ data.label }}
                            </div>
                          </template>
                        </Column>

                        <!-- Colonne dynamique pour chaque véhicule -->
                        <Column
                          v-for="(vehicule, index) in comparo.vehicules"
                          :key="'non_colored_'+vehicule.id+section.id"
                          :field="`vehicule_${index}.value`"
                          class="value-column"
                        >
                          <template #body="{ data }">
                            <div
                              class="text-center py-1 font-medium transition-all duration-200 rounded px-2 text-sm flex items-center justify-center h-10"
                              :class="[
                                data[`vehicule_${index}`]?.class || ''
                              ]"
                            >
                              {{ data[`vehicule_${index}`]?.value }}
                            </div>
                          </template>
                        </Column>
                      </DataTable>
                    </transition>

                    <!-- Lignes colorées (toujours affichées) -->
                    <DataTable
                      v-if="sectionsData[section.id]?.hasColoredRows"
                      :value="sectionsData[section.id].coloredRows"
                      class="comparison-table comparison-animate-load"
                      size="small"
                      :showHeaders="false"
                      :rowHover="true"
                      :style="`--total-columns: ${comparo.vehicules.length + 1}`"
                    >
                      <!-- Colonne pour le nom des propriétés -->
                      <Column
                        field="label"
                        class="property-column"
                      >
                        <template #body="{ data }">
                          <div class="font-medium text-white py-1 text-sm flex items-center h-10">
                            {{ data.label }}
                          </div>
                        </template>
                      </Column>

                      <!-- Colonne dynamique pour chaque véhicule -->
                      <Column
                        v-for="(vehicule, index) in comparo.vehicules"
                        :key="'colored_'+vehicule.id+section.id"
                        :field="`vehicule_${index}.value`"
                        class="value-column"
                      >
                        <template #body="{ data }">
                          <div
                            class="text-center py-1 font-medium transition-all duration-200 rounded px-2 text-sm flex items-center justify-center h-10"
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
                </div>
              </div>

              <!-- Bouton de retour uniquement -->
              <div class="flex justify-center mt-3">
                <Button
                  type="button"
                  outlined
                  @click="router.push('/comparos')"
                  class="btn-primary w-[200px] min-w-[200px]"
                >
                  Retour Comparos
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
/* Styles spécifiques à la page d'analyse */

/* Panel headers personnalisés pour cette page */
:deep(.p-panel .p-panel-header) {
  background: var(--surface-900) !important;
  border: none;
  border-radius: 0;
  transition: all 0.3s ease;
}

:deep(.p-panel .p-panel-header:hover) {
  background: var(--surface-800) !important;
}

:deep(.p-panel .p-panel-content) {
  border: none;
  padding: 0;
}

:deep(.p-panel.p-panel-toggleable .p-panel-header .p-panel-header-icon) {
  color: #6366f1;
  transition: all 0.3s ease;
}

:deep(.p-panel.p-panel-toggleable .p-panel-header .p-panel-header-icon:hover) {
  color: #4f46e5;
  transform: scale(1.1);
}

/* Corrections pour les overflow qui cassent le sticky/fixed */
.sections-container {
  overflow: visible !important;
}

:deep(.p-panel) {
  overflow: visible !important;
}

:deep(.p-panel-content) {
  overflow: visible !important;
}

/* CSS pour uniformiser la largeur des colonnes */
.comparison-header-grid {
  display: grid;
  grid-template-columns: repeat(var(--total-columns, 2), minmax(140px, 1fr));
  min-width: calc(140px * var(--total-columns, 2));
  width: 100%;
}

/* Largeur minimale pour les colonnes d'en-tête */
.comparison-header-grid > div {
  min-width: 140px;
}

:deep(.comparison-table .p-datatable-table) {
  table-layout: fixed !important;
  width: 100% !important;
}

:deep(.comparison-table .p-datatable-thead > tr > th) {
  width: calc(100% / var(--total-columns, 2)) !important;
  min-width: 0 !important;
  padding: 0.5rem !important;
}

:deep(.comparison-table .p-datatable-tbody > tr > td) {
  width: calc(100% / var(--total-columns, 2)) !important;
  min-width: 0 !important;
  padding: 0.5rem !important;
  text-align: center !important;
  vertical-align: middle !important;
}

:deep(.comparison-table .property-column) {
  width: calc(100% / var(--total-columns, 2)) !important;
  min-width: 0 !important;
}

:deep(.comparison-table .value-column) {
  width: calc(100% / var(--total-columns, 2)) !important;
  min-width: 0 !important;
}

/* Transitions pour le collapse/expand */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.collapse-enter-to {
  max-height: 1000px;
  opacity: 1;
  transform: translateY(0);
}

.collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
  transform: translateY(0);
}

.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

/* Gestion du scroll horizontal et tailles de colonnes */
.section-content-wrapper {
  width: 100%;
  max-width: 100vw;
}

/* Forcer une largeur minimale pour les tableaux */
:deep(.comparison-table .p-datatable-table) {
  table-layout: fixed !important;
  min-width: calc(140px * var(--total-columns, 2)) !important;
  width: 100% !important;
}

/* Force aussi la div wrapper du DataTable */
:deep(.comparison-table .p-datatable-wrapper) {
  min-width: calc(140px * var(--total-columns, 2)) !important;
  width: 100% !important;
}

:deep(.comparison-table) {
  min-width: calc(140px * var(--total-columns, 2)) !important;
  width: 100% !important;
}

/* Largeur minimale pour chaque colonne */
:deep(.comparison-table .p-datatable-thead > tr > th) {
  min-width: 140px !important;
  width: calc(100% / var(--total-columns, 2)) !important;
}

:deep(.comparison-table .p-datatable-tbody > tr > td) {
  min-width: 140px !important;
  width: calc(100% / var(--total-columns, 2)) !important;
}

:deep(.comparison-table .property-column) {
  min-width: 140px !important;
  width: calc(100% / var(--total-columns, 2)) !important;
}

:deep(.comparison-table .value-column) {
  min-width: 140px !important;
  width: calc(100% / var(--total-columns, 2)) !important;
}

</style>
