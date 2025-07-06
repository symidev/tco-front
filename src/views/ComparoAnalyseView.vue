<script setup>
import {ref, onMounted, computed, watch, nextTick, onBeforeUnmount} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useToast} from 'primevue/usetoast';
import ProgressSpinner from 'primevue/progressspinner';
import Card from 'primevue/card';
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Panel from 'primevue/panel';

import {comparoService} from '@/services/api/comparoService';
import {BarChart3, AreaChart, Table, FileSpreadsheet, FileText} from 'lucide-vue-next';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  ArcElement,
  PieController
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  ArcElement,
  PieController,
  ChartDataLabels
);

const route = useRoute();
const router = useRouter();
const toast = useToast();

const loading = ref(true);
const comparo = ref(null);
const expandedSections = ref(new Set());
const headerScrollContainer = ref(null);
const isScrollSyncing = ref(false);
const scrollListeners = ref([]);

const displayMode = ref(false); // false for data, true for graphics
const chartCanvas = ref(null);
const chartInstance = ref(null);
const pieChartInstances = ref([]);

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

// Fonction pour convertir les heures décimales en format heures:minutes (ex: 2.5 => "2h30")
const formatHeuresMinutes = (heuresDecimales) => {
  if (!heuresDecimales || !Number.isFinite(heuresDecimales)) {
    return '-';
  }

  const heures = Math.floor(heuresDecimales);
  const minutes = Math.round((heuresDecimales - heures) * 60);

  // Gérer le cas où les minutes arrondies donnent 60
  if (minutes === 60) {
    return `${heures + 1}h`;
  }

  if (minutes === 0) {
    return `${heures}h`;
  } else {
    return `${heures}h${minutes.toString().padStart(2, '0')}`;
  }
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
      case 'prix':
        return getPrixTotal(vehicule);
      case 'prix_remise':
        return getPrixRemise(vehicule);
      case 'loyer':
        return vehicule.calcul?.loyer_total || 0;
      case 'fiscalite':
        return vehicule.calcul?.fiscalite_mensuel || 0;
      case 'carburant':
        return vehicule.calcul?.budget_mensuel_total_energie || 0;
      case 'tco':
        return vehicule.calcul?.tcoMensuel || 0;
      case 'prk':
        return getPRK(vehicule);
      case 'prk_contrat':
        return vehicule.calcul?.prk || 0;
      case 'is_and':
        return vehicule.calcul?.isAnd || 0;
      case 'charges_patronales_aen':
        return vehicule.calcul?.aenChargePatronale || 0;
      default:
        return 0;
    }
  });

  return Math.min(...values);
};

const getMaxValue = (field) => {
  if (!comparo.value?.vehicules?.length) return -Infinity;

  let values = comparo.value.vehicules.map(vehicule => {
    switch (field) {
      case 'prix':
        return getPrixTotal(vehicule);
      case 'prix_remise':
        return getPrixRemise(vehicule);
      case 'loyer':
        return vehicule.calcul?.loyer_total || 0;
      case 'fiscalite':
        return vehicule.calcul?.fiscalite_mensuel || 0;
      case 'carburant':
        return vehicule.calcul?.budget_mensuel_total_energie || 0;
      case 'tco':
        return vehicule.calcul?.tcoMensuel || 0;
      case 'prk':
        return getPRK(vehicule);
      case 'prk_contrat':
        return vehicule.calcul?.prk || 0;
      case 'is_and':
        return vehicule.calcul?.isAnd || 0;
      case 'charges_patronales_aen':
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

// Fonction pour formater les valeurs monétaires
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'EUR'}).format(value);
};

// Fonction pour formater les pourcentages
const formatPercent = (value) => {
  if (value === undefined || value === null) return '';
  return `${value}%`;
};

// Fonction pour formater les valeurs décimales
const formatNumber = (value, decimals = 2) => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('fr-FR', {maximumFractionDigits: decimals}).format(value);
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

  let labelPlage = '';
  if (comparo.value.plageElecMin || comparo.value.plageElecMax) {
    labelPlage = comparo.value.plageElecMin + '% - ' + comparo.value.plageElecMax + '%';
  }
  const sections = [
    {
      id: 'infos_vehicule',
      title: 'Infos véhicule',
      rows: [
        {id: 'loueur', name: 'Loueur', getValue: (v) => v.loueur?.name || '-'},
        {id: 'marque', name: 'Marque', getValue: (v) => v.marque?.name || '-'},
        {id: 'modele', name: 'Modèle', getValue: (v) => v.modele?.title || '-'},
        {
          id: 'moteur_finition',
          name: 'Moteur/Finition',
          getValue: (v) => v.modele?.moteur ? v.modele?.moteur : v.finition || '-'
        },
        {id: 'type_fisc', name: 'Type fiscal', getValue: (v) => v.type_fisc?.toUpperCase() || '-'},
        {id: 'energie', name: 'Énergie', getValue: (v) => v.energie?.toUpperCase() || '-'},
        //{ id: 'puissance', name: 'Puissance', getValue: (v) => v.puissance ? `${v.puissance} ch` : '-' },
        //{ id: 'puissance_kw', name: 'Puissance KW', getValue: (v) => getPuissanceKW(v.puissance) ? `${getPuissanceKW(v.puissance)} kW` : '-' },
        {
          id: 'conso_carb',
          name: 'Consommation carburant',
          getValue: (v) => v.conso_carb ? `${formatNumber(v.conso_carb, 1)} L/100km` : '-'
        },
        {
          id: 'conso_kwh',
          name: 'Consommation kwh',
          getValue: (v) => v.conso_kwh ? `${formatNumber(v.conso_kwh, 1)} kWh/100km` : '-'
        },
        {id: 'co2', name: 'Émission CO2 WLTP', getValue: (v) => v.co2 ? `${v.co2} g/km` : '-'},
        {id: 'poids', name: 'Poids véhicule (PVOM)', getValue: (v) => v.pvom ? `${v.pvom} kg` : '-'},
        {
          id: 'autonomie',
          name: 'Autonomie batterie (WLTP)',
          getValue: (v) => v.modele?.autonomie ? `${v.modele?.autonomie} km` : '-'
        },
        {
          id: 'capacite_batterie',
          name: 'Capacité de la batterie',
          getValue: (v) => v.capacite_batterie ? `${v.capacite_batterie} kWh` : '-'
        },
        {
          id: 'vitesse_recharge',
          name: 'Capacité de recharge de la batterie',
          getValue: (v) => v.vitesse_recharge_batterie ? `${v.vitesse_recharge_batterie} kW` : '-'
        },
        {
          id: 'temps_recharge_plage',
          name: 'Temps recharge batterie ' + labelPlage,
          getValue: (v) => v.calcul?.vitesse_recharge_plage ? formatHeuresMinutes(v.calcul.vitesse_recharge_plage) : '-'
        },
        {
          id: 'temps_recharge_100km',
          name: 'Temps recharge batterie 100km',
          getValue: (v) => v.calcul?.vitesse_recharge_100 ? formatHeuresMinutes(v.calcul.vitesse_recharge_100) : '-'
        },

        {id: 'prix', name: 'Prix du véhicule non remisé', getValue: (v) => formatCurrency(v.prix)},
        {id: 'prix_options', name: 'Montant option(s) non remisé', getValue: (v) => formatCurrency(v.prix_options)},
        {
          id: 'prix_total', name: 'Prix total avec options',
          getValue: (v) => formatCurrency(getPrixTotal(v)),
          field: 'prix',
          getClass: (v) => getCellClass(getPrixTotal(v), 'prix')
        },
        {id: 'remise', name: 'Remise en %', getValue: (v) => formatPercent(v.remise)},
        {
          id: 'prix_remise', name: 'Prix remisé TTC',
          getValue: (v) => formatCurrency(getPrixRemise(v)),
          field: 'prix_remise',
          getClass: (v) => getCellClass(getPrixRemise(v), 'prix_remise')
        }
      ]
    },
    {
      id: 'contrat',
      title: 'Contrat',
      rows: [
        {id: 'loyer_financier', name: 'Loyer Financier', getValue: (v) => formatCurrency(v.loyer_financier)},
        {id: 'entretien', name: 'Entretien', getValue: (v) => formatCurrency(v.entretien)},
        {id: 'pneumatiques', name: 'Pneumatiques', getValue: (v) => formatCurrency(v.pneumatique)},
        {
          id: 'gardiennage_pneumatiques',
          name: 'Gardiennage des pneumatiques',
          getValue: (v) => formatCurrency(v.pneumatique_garde)
        },
        {id: 'vehicule_relais', name: 'Véhicule Relais', getValue: (v) => formatCurrency(v.vehicule_relais)},
        {id: 'assurance_rc', name: 'Assurance RC', getValue: (v) => formatCurrency(v.assurance_rc)},
        {id: 'assurance_dommages', name: 'Assurance Dommages', getValue: (v) => formatCurrency(v.assurance_dommage)},
        {id: 'perte_financiere', name: 'Perte Financière', getValue: (v) => formatCurrency(v.perte_fi)},
        {id: 'carte_carburant', name: 'Carte (s) Carburant', getValue: (v) => formatCurrency(v.carte_carb)},
        {id: 'carte_electrique', name: 'Carte électrique', getValue: (v) => formatCurrency(v.carte_elec)},
        {id: 'badge_telepeage', name: 'Badge Télépéage', getValue: (v) => formatCurrency(v.badge_telepeage)},
        {id: 'pastille_critair', name: 'Pastille Crit\'Air', getValue: (v) => formatCurrency(v.vignette_critair)},
        {id: 'autre_cout', name: 'Autre coût', getValue: (v) => formatCurrency(v.autre_cout)},
        {
          id: 'loyer_total', name: 'Loyer total',
          getValue: (v) => formatCurrency(v.calcul?.loyer_total),
          field: 'loyer',
          getClass: (v) => getCellClass(v.calcul?.loyer_total, 'loyer')
        },
        {
          id: 'prk_contrat', name: 'PRK /km',
          getValue: (v) => formatCurrency(v.calcul?.prk),
          field: 'prk_contrat',
          getClass: (v) => getCellClass(v.calcul?.prk, 'prk_contrat')
        }
      ]
    },
    {
      id: 'fiscalite',
      title: 'Fiscalité',
      rows: [
        {id: 'malus_co2', name: 'Malus CO² (une fois)', getValue: (v) => formatCurrency(v.calcul?.malus_co2)},
        {id: 'taxe_co2', name: 'Taxe C0² (annuelle)', getValue: (v) => formatCurrency(v.calcul?.taxe_co2)},
        {
          id: 'taxe_polluant',
          name: 'Taxe polluants (annuelle)',
          getValue: (v) => formatCurrency(v.calcul?.taxe_polluant)
        },
        {id: 'taxe_masse', name: 'Taxe à la masse (une fois)', getValue: (v) => formatCurrency(v.calcul?.taxe_masse)},
        {
          id: 'fiscalite_mensuelle', name: 'Fiscalité mensuelle',
          getValue: (v) => formatCurrency(v.calcul?.fiscalite_mensuel),
          field: 'fiscalite',
          getClass: (v) => getCellClass(v.calcul?.fiscalite_mensuel, 'fiscalite')
        }
      ]
    },
    {
      id: 'energie',
      title: 'Énergie',
      rows: [
        {
          id: 'energie_thermique',
          name: 'Prix de l\'énergie Thermique €',
          getValue: (v) => v.calcul?.prix_energie_thermique ? formatCurrency(v.calcul.prix_energie_thermique) : '-'
        },
        {
          id: 'energie_electrique',
          name: 'Prix de l\'énergie Electrique €',
          getValue: (v) => v.calcul?.prix_energie_electrique ? formatCurrency(v.calcul.prix_energie_electrique) : '-'
        },
        {
          id: 'carburant_mensuel', name: 'Budget énergie mensuel',
          getValue: (v) => formatCurrency(v.calcul?.budget_mensuel_total_energie),
          field: 'carburant',
          getClass: (v) => getCellClass(v.calcul?.budget_mensuel_total_energie, 'carburant')
        }
      ]
    },
    {
      id: 'is_and',
      title: 'IS sur AND',
      rows: [
        {
          id: 'pct_imposition_client',
          name: '% d\'imposition Client (IS)',
          getValue: (v) => formatPercent(comparo.value?.is)
        },
        {id: 'plafond_and', name: 'Plafond d\'AND', getValue: (v) => formatCurrency(v.calcul?.plafondAnd)},
        {id: 'calcul_and_mensuel', name: 'Calcul AND Mensuel', getValue: (v) => formatCurrency(v.calcul?.andMensuel)},
        {
          id: 'is_and_value', name: 'IS sur AND',
          getValue: (v) => formatCurrency(v.calcul?.isAnd),
          field: 'is_and',
          getClass: (v) => getCellClass(v.calcul?.isAnd, 'is_and')
        }
      ]
    },
    {
      id: 'aen_details',
      title: 'AEN',
      rows: [
        {id: 'taux_aen', name: 'Taux AEN', getValue: (v) => formatPercent(v.aen)},
        {id: 'aen_mensuel_detail', name: 'AEN Mensuel', getValue: (v) => formatCurrency(v.calcul?.aenMensuel)},
        {
          id: 'taux_charges_patronales',
          name: 'Taux charges patronales',
          getValue: (v) => formatPercent(v.chargePatronale)
        },
        {
          id: 'charges_patronales_aen', name: 'Charges patronales sur AEN',
          getValue: (v) => formatCurrency(v.calcul?.aenChargePatronale),
          field: 'charges_patronales_aen',
          getClass: (v) => getCellClass(v.calcul?.aenChargePatronale, 'charges_patronales_aen')
        }
      ]
    },
    {
      id: 'tco',
      title: 'TCO',
      rows: [
        {
          id: 'tco_mensuel', name: 'TCO mensuel',
          getValue: (v) => formatCurrency(v.calcul?.tcoMensuel),
          field: 'tco',
          getClass: (v) => getCellClass(v.calcul?.tcoMensuel, 'tco')
        },
        {id: 'tco_moyen', name: 'TCO Moyen mensuel', getValue: () => formatCurrency(getTCOMoyen.value)},
        {
          id: 'prk', name: 'PRK /km',
          getValue: (v) => formatCurrency(getPRK(v)),
          field: 'prk',
          getClass: (v) => getCellClass(getPRK(v), 'prk')
        },
        {id: 'tco_total', name: 'TCO Total (durée du contrat)', getValue: (v) => formatCurrency(getTCOTotal(v))}
      ]
    },
    {
      id: 'ventilation_tco',
      title: 'Ventilation TCO',
      rows: [
        {
          id: 'tco_loyer',
          name: 'Loyer et services (en %)',
          getValue: (v) => formatPercent(getTCOVentilation(v, 'loyer'))
        },
        {
          id: 'tco_fiscalite',
          name: 'Fiscalité (en %)',
          getValue: (v) => formatPercent(getTCOVentilation(v, 'fiscalite'))
        },
        {
          id: 'tco_carburant',
          name: 'Carburant (en %)',
          getValue: (v) => formatPercent(getTCOVentilation(v, 'carburant'))
        },
        {
          id: 'aen_charge',
          name: 'Charges sur AEN (en %)',
          getValue: (v) => formatPercent(getTCOVentilation(v, 'aenCharge'))
        },
        {id: 'is_and', name: 'IS sur AND (en %)', getValue: (v) => formatPercent(getTCOVentilation(v, 'isAnd'))}
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


// Fonction pour nettoyer les écouteurs existants
const cleanupScrollListeners = () => {
  scrollListeners.value.forEach(({ element, handler }) => {
    element.removeEventListener('scroll', handler);
  });
  scrollListeners.value = [];
};

// Fonction pour attacher les événements de scroll
const attachScrollListeners = () => {
  // Nettoyer les anciens écouteurs
  cleanupScrollListeners();

  // Écouteur pour l'en-tête original
  if (headerScrollContainer.value) {
    const headerHandler = (e) => {
      syncScrollPosition(e.target, e.target.scrollLeft);
    };
    headerScrollContainer.value.addEventListener('scroll', headerHandler);
    scrollListeners.value.push({
      element: headerScrollContainer.value,
      handler: headerHandler
    });
  }

  // Écouteurs pour toutes les sections
  const allSectionContainers = document.querySelectorAll('.section-scroll-container');

  allSectionContainers.forEach((container) => {
    const sectionHandler = (e) => {
      syncScrollPosition(e.target, e.target.scrollLeft);
    };
    container.addEventListener('scroll', sectionHandler);
    scrollListeners.value.push({
      element: container,
      handler: sectionHandler
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

// Réattacher les écouteurs quand les sections sont toggles
watch(expandedSections, () => {
  nextTick(() => {
    setTimeout(() => {
      attachScrollListeners();
    }, 50);
  });
}, { deep: true });

// Réattacher les écouteurs quand le mode d'affichage change
watch(displayMode, (newMode) => {
  nextTick(() => {
    setTimeout(() => {
      attachScrollListeners();
      // Créer les graphiques quand on passe en mode graphique
      if (newMode && chartCanvas.value) {
        createChart();
        createPieCharts();
      }
    }, 50);
  });
});

// Fonction pour générer le nom d'un véhicule
const getVehicleLabel = (vehicule) => {
  const marque = vehicule.marque?.name || '';
  const modele = vehicule.modele?.title || '';
  const moteur = vehicule.modele?.moteur || '';
  const finition = vehicule.finition || '';

  let label = `${marque} ${modele}`;
  if (moteur) {
    label += ` ${moteur}`;
  } else if (finition) {
    label += ` ${finition}`;
  }

  return label.trim();
};

// Fonction pour créer/mettre à jour le graphique
const createChart = () => {
  if (!chartCanvas.value || !comparo.value?.vehicules?.length) return;

  // Détruire l'instance existante si elle existe
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }

  const ctx = chartCanvas.value.getContext('2d');

  // Préparer les données dynamiques
  const labels = comparo.value.vehicules.map(vehicule => getVehicleLabel(vehicule));

  const loyerTotalData = comparo.value.vehicules.map(v => v.calcul?.loyer_total || 0);
  const fiscaliteMensuelleData = comparo.value.vehicules.map(v => v.calcul?.fiscalite_mensuel || 0);
  const budgetEnergieData = comparo.value.vehicules.map(v => v.calcul?.budget_mensuel_total_energie || 0);
  const isAndData = comparo.value.vehicules.map(v => v.calcul?.isAnd || 0);
  const chargesPatronalesData = comparo.value.vehicules.map(v => v.calcul?.aenChargePatronale || 0);
  const tcoMensuelData = comparo.value.vehicules.map(v => v.calcul?.tcoMensuel || 0);

  // TCO moyen
  const tcoMoyen = getTCOMoyen.value;
  const tcoMoyenData = comparo.value.vehicules.map(() => tcoMoyen);

  // Calculer le max pour l'axe Y
  const maxTco = Math.max(...tcoMensuelData, tcoMoyen);
  const yAxisMax = Math.ceil(maxTco / 200) * 200 + 200;

  // Titre dynamique
  const dureeText = comparo.value.duree ? `${comparo.value.duree} mois` : '';
  const kmText = comparo.value.km ? `${(comparo.value.km / 1000).toLocaleString('fr-FR')} 000 kms` : '';
  const chartTitle = `${comparo.value.title} - ${dureeText} - ${kmText}`;

  // Configuration du graphique avec les données dynamiques
  const chartConfig = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: "Loyer total",
          data: loyerTotalData,
          backgroundColor: "#5B9BD5",
          stack: "stack1",
          order: 2,
          borderWidth: 0,
          datalabels: {
            display: false
          }
        },
        {
          label: "Fiscalité mensuelle",
          data: fiscaliteMensuelleData,
          backgroundColor: "#A5A5A5",
          stack: "stack1",
          order: 2,
          borderWidth: 0,
          datalabels: {
            display: false
          }
        },
        {
          label: "Budget énergie mensuel",
          data: budgetEnergieData,
          backgroundColor: "#ED7D31",
          stack: "stack1",
          order: 2,
          borderWidth: 0,
          datalabels: {
            display: false
          }
        },
        {
          label: "IS sur AND",
          data: isAndData,
          backgroundColor: "#70AD47",
          stack: "stack1",
          order: 2,
          borderWidth: 0,
          datalabels: {
            display: false
          }
        },
        {
          label: "Charges patronales sur AEN",
          data: chargesPatronalesData,
          backgroundColor: "#264478",
          stack: "stack1",
          order: 2,
          borderWidth: 0,
          datalabels: {
            display: false
          }
        },
        {
          type: "line",
          label: "TCO mensuel",
          data: tcoMensuelData,
          borderColor: "#FFC000",
          borderWidth: 2,
          backgroundColor: "transparent",
          fill: false,
          tension: 0,
          pointRadius: 4,
          pointBackgroundColor: "#FFC000",
          pointBorderColor: "#333",
          pointBorderWidth: 1,
          order: 1,
          datalabels: {
            display: true,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderColor: "#FFC000",
            borderRadius: 4,
            borderWidth: 1,
            color: "#333",
            font: {
              size: 10,
              weight: "bold"
            },
            padding: 3,
            anchor: "end",
            align: "top",
            offset: 6,
            formatter: (value) => `${value.toLocaleString('fr-FR', {maximumFractionDigits: 0})}€`
          }
        },
        {
          type: "line",
          label: "TCO moyen",
          data: tcoMoyenData,
          borderColor: "#C55A5A",
          borderWidth: 2,
          fill: false,
          borderDash: [],
          order: 1,
          pointRadius: 0,
          pointBackgroundColor: "#C55A5A",
          pointBorderColor: "#C55A5A",
          tension: 0,
          datalabels: {
            display: false
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          left: 10,
          right: 10,
          bottom: 10
        }
      },
      plugins: {
        datalabels: {
          display: false
        },
        legend: {
          position: "bottom",
          labels: {
            padding: 25,
            color: "#CCCCCC",
            font: {
              size: 11
            },
            usePointStyle: true,
            boxWidth: 20
          }
        },
        title: {
          display: true,
          text: chartTitle,
          color: "#CCCCCC",
          font: {
            size: 14,
            weight: "bold"
          },
          padding: {
            top: 0,
            bottom: 40
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: "#CCCCCC",
            font: {
              size: 10
            }
          }
        },
        y: {
          max: yAxisMax,
          grid: {
            color: "rgba(255, 255, 255, 0.08)",
            borderDash: [
              3,
              3
            ],
            drawBorder: false
          },
          ticks: {
            color: "#CCCCCC",
            stepSize: 200,
            padding: 8
          },
          title: {
            display: true,
            text: "€/mois",
            color: "#CCCCCC"
          }
        }
      },
      elements: {
        bar: {
          borderRadius: 0,
          borderSkipped: false
        }
      }
    }
  };
  // faire un console.log de chartConfig en json
  chartInstance.value = new ChartJS(ctx, chartConfig);
};

// Fonction pour créer les camemberts de ventilation TCO
const createPieCharts = () => {
  if (!comparo.value?.vehicules?.length) return;

  // Nettoyer les instances existantes
  pieChartInstances.value.forEach(instance => {
    if (instance) instance.destroy();
  });
  pieChartInstances.value = [];

  comparo.value.vehicules.forEach((vehicule, index) => {
    const canvasId = `pieChart_${index}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const tcoMensuel = vehicule.calcul?.tcoMensuel || 0;

    if (tcoMensuel === 0) return;

    // Calculer les pourcentages pour le camembert
    const loyerTotal = vehicule.calcul?.loyer_total || 0;
    const fiscaliteMensuelle = vehicule.calcul?.fiscalite_mensuel || 0;
    const budgetEnergie = vehicule.calcul?.budget_mensuel_total_energie || 0;
    const isAnd = vehicule.calcul?.isAnd || 0;
    const chargesPatronales = vehicule.calcul?.aenChargePatronale || 0;

    // Calculer les pourcentages
    const loyerPct = tcoMensuel ? ((loyerTotal / tcoMensuel) * 100) : 0;
    const fiscalitePct = tcoMensuel ? ((fiscaliteMensuelle / tcoMensuel) * 100) : 0;
    const energiePct = tcoMensuel ? ((budgetEnergie / tcoMensuel) * 100) : 0;
    const isAndPct = tcoMensuel ? ((isAnd / tcoMensuel) * 100) : 0;
    const chargesPatronalesPct = tcoMensuel ? ((chargesPatronales / tcoMensuel) * 100) : 0;

    const pieConfig = {
      type: 'pie',
      data: {
        labels: [
          'Loyer total',
          'Fiscalité mensuelle',
          'Budget énergie',
          'IS sur AND',
          'Charges patronales AEN'
        ],
        datasets: [{
          data: [loyerPct, fiscalitePct, energiePct, isAndPct, chargesPatronalesPct],
          backgroundColor: [
            '#5B9BD5',
            '#A5A5A5',
            '#ED7D31',
            '#70AD47',
            '#264478'
          ],
          borderWidth: 2,
          borderColor: '#2d3748'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          datalabels: {
            display: false
          },
          legend: {
            display: false
          },
          title: {
            display: true,
            text: getVehicleLabel(vehicule),
            color: '#CCCCCC',
            font: {
              size: 12,
              weight: 'bold'
            },
            padding: {
              top: 5,
              bottom: 10
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const percentage = context.parsed;
                return `${label}: ${percentage.toFixed(1)}%`;
              }
            }
          }
        },
        layout: {
          padding: 10
        }
      }
    };
    console.log(JSON.stringify(pieConfig));
    const instance = new ChartJS(ctx, pieConfig);
    pieChartInstances.value.push(instance);
  });
};

// Nettoyer les écouteurs lors du démontage du composant
onBeforeUnmount(() => {
  cleanupScrollListeners();
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }
  pieChartInstances.value.forEach(instance => {
    if (instance) instance.destroy();
  });
});

</script>

<template>
  <div class="page-container">

    <div class="page-content">
      <!-- Header avec titre -->
      <div class="page-header">
        <div class="header-content flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
          <div class="title-section">
            <h1 class="page-title">
              <BarChart3 class="title-icon"/>
              Analyse du comparo
            </h1>
            <p class="page-subtitle">Résultats détaillés de votre comparaison de véhicules</p>
          </div>

          <!-- ToggleSwitch pour changer de mode -->
          <div class="flex items-center gap-4 lg:flex-shrink-0" v-if="comparo">
            <span
                class="text-base cursor-pointer hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
                :class="!displayMode ? 'text-amber-500' : 'text-white'"
                @click="displayMode = false"
            >
              <Table class="h-5 w-5"/>
              <span class="hidden sm:inline">Données</span>
            </span>
            <ToggleSwitch
                v-model="displayMode"
                class="mode-toggle-switch"
                :class="{ 'active': displayMode }"
            />
            <span
                class="text-base cursor-pointer hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
                :class="displayMode ? 'text-amber-500' : 'text-white'"
                @click="displayMode = true"
            >
              <AreaChart class="h-5 w-5"/>
              <span class="hidden sm:inline">Graphique</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <ProgressSpinner class="loading-spinner"/>
          <p class="loading-text">Chargement de l'analyse...</p>
        </div>
      </div>


      <!-- Contenu principal -->
      <div v-else-if="comparo" class="content-grid animate-slide-in-up">
        <!-- Section d'analyse complète -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <BarChart3 class="section-icon"/>
              <div class="flex flex-col gap-3 flex-1">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h2 class="text-2xl font-bold">{{ comparo.title }}</h2>
                    <div class="flex flex-wrap gap-2">
                      <div
                          class="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {{ comparo.duree || 0 }} mois
                      </div>
                      <div
                          class="inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        {{ comparo.km ? (comparo.km / 1000).toLocaleString('fr-FR') + ' 000 km' : '0 km' }}
                      </div>
                    </div>
                  </div>
                  <!-- Boutons d'action alignés à droite -->
                  <div class="flex gap-3">
                    <Button
                        @click="downloadExcel"
                        class="export-btn export-excel"
                        v-tooltip.bottom="'Télécharger au format Excel (.xlsx)'"
                    >
                      <FileSpreadsheet class="w-4 h-4" />
                      <span class="export-text">Excel</span>
                    </Button>
                    <Button
                        @click="downloadPDF"
                        class="export-btn export-pdf"
                        v-tooltip.bottom="'Télécharger au format PDF'"
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
              <!-- Wrapper for data mode -->
              <div v-if="!displayMode" class="animate-fade-in">
                <!-- En-tête avec véhicules -->
                <div
                    class="comparison-header-sticky border-0 shadow-sm mb-3 rounded-lg overflow-x-auto header-scroll-container"
                    ref="headerScrollContainer">
                  <div class="comparison-header-grid gap-0" :style="`--total-columns: ${comparo.vehicules.length + 1}`">
                    <div
                        class="header-criteria bg-surface-900 p-2 font-medium text-white border-0 text-sm flex items-center">

                    </div>
                    <div
                        v-for="(vehicule, index) in comparo.vehicules"
                        :key="'header_'+vehicule.id"
                        class="bg-surface-900 text-center p-2 border-0 hover:bg-surface-800 transition-all duration-200 flex flex-col justify-center items-center"
                    >
                      <div class="font-medium text-white text-xs">{{ vehicule?.marque?.name }}</div>
                      <div class="text-xs text-gray-300">{{ vehicule?.modele?.title }}</div>
                      <div class="text-xs text-blue-400 font-medium">
                        {{ vehicule?.modele?.moteur ? vehicule?.modele?.moteur : vehicule?.finition }}
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
                        :class="{ 'cursor-pointer': sectionsData[section.id]?.hasNonColoredRows }"
                        @click="sectionsData[section.id]?.hasNonColoredRows && toggleSection(section.id)">
                      <div class="flex items-center gap-2 w-full">
                        <span class="font-medium text-white text-lg">{{ section.title }}</span>
                        <div v-if="sectionsData[section.id]?.hasNonColoredRows" class="ml-auto flex items-center gap-2">
                          <span class="text-xs text-gray-300 hidden sm:inline">
                            {{
                              expandedSections.has(section.id) ? 'Cliquez ici pour masquer' : 'Cliquez ici pour voir plus'
                            }}
                          </span>
                          <div
                              class="bg-amber-500 hover:bg-amber-400 rounded-full p-2 transition-all duration-200 transform hover:scale-110 shadow-lg">
                            <svg
                                class="w-4 h-4 text-white transition-transform duration-300"
                                :class="{ 'rotate-180': expandedSections.has(section.id) }"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2.5"
                            >
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Contenu de section -->
                    <div
                        class="bg-transparent rounded-b-lg shadow-sm overflow-x-auto section-content-wrapper section-scroll-container"
                        :data-section-id="section.id">
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
              </div>

              <!-- Wrapper for graphics mode -->
              <div v-else class="animate-fade-in">
                <div class="bg-surface-800 rounded-lg shadow-inner p-6">
                  <div class="mb-6">
                    <h3 class="text-2xl font-bold text-white flex items-center gap-2">
                      <AreaChart class="h-6 w-6 text-blue-500"/>
                      Comparatif TCO
                    </h3>
                    <p class="text-surface-400 mt-2">Analyse graphique des coûts totaux de possession</p>
                  </div>

                  <div class="chart-container bg-surface-900 rounded-lg p-4" style="height: 500px;">
                    <canvas ref="chartCanvas"></canvas>
                  </div>
                </div>

                <!-- Bloc Ventilation TCO par véhicule -->
                <div class="bg-surface-800 rounded-lg shadow-inner p-6 mt-6">
                  <div class="mb-6">
                    <h3 class="text-2xl font-bold text-white flex items-center gap-2">
                      <AreaChart class="h-6 w-6 text-green-500"/>
                      Ventilation TCO par véhicule
                    </h3>
                    <p class="text-surface-400 mt-2">Répartition des coûts par composant pour chaque véhicule</p>
                  </div>

                  <!-- Légende commune -->
                  <div class="mb-6 bg-surface-900 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-white mb-3">Légende</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                      <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full" style="background-color: #5B9BD5;"></div>
                        <span class="text-sm text-gray-300">Loyer total</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full" style="background-color: #A5A5A5;"></div>
                        <span class="text-sm text-gray-300">Fiscalité mensuelle</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full" style="background-color: #ED7D31;"></div>
                        <span class="text-sm text-gray-300">Budget énergie</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full" style="background-color: #70AD47;"></div>
                        <span class="text-sm text-gray-300">IS sur AND</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full" style="background-color: #264478;"></div>
                        <span class="text-sm text-gray-300">Charges patronales AEN</span>
                      </div>
                    </div>
                  </div>

                  <div class="pie-charts-grid">
                    <div
                      v-for="(vehicule, index) in comparo.vehicules"
                      :key="`pie_${vehicule.id}`"
                      class="pie-chart-item bg-surface-900 rounded-lg p-4"
                    >
                      <div class="pie-chart-container">
                        <canvas :id="`pieChart_${index}`" width="200" height="200"></canvas>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <!-- Bouton de retour uniquement -->
              <div class="flex justify-start mt-3">
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
/* Animation for mode switching */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease-in-out;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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

/* Styles pour le header et l'alignement - Surcharge des styles globaux */
.page-header {
  width: 100%;
  margin-bottom: 1.5rem;
}

.header-content {
  width: 100% !important;
  max-width: none !important;
}

.title-section {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  text-align: left !important;
  gap: 0.5rem !important;
}

/* Responsive adjustments */
@media (min-width: 1024px) {
  .header-content {
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
  }

  .title-section {
    flex: 1 !important;
  }
}

@media (max-width: 1023px) {
  .header-content {
    flex-direction: column !important;
    align-items: flex-start !important;
  }

  .title-section {
    margin-bottom: 0.5rem;
  }
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--p-text-color);
}

.page-subtitle {
  margin: 0.25rem 0 0 0;
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
}

.title-icon {
  width: 1.5rem;
  height: 1.5rem;
}

/* Styles pour le ToggleSwitch personnalisé */
.mode-toggle-switch {
  --p-toggleswitch-width: 3.5rem;
  --p-toggleswitch-height: 2rem;
  --p-toggleswitch-border-radius: 30px;
  --p-toggleswitch-handle-size: 1.5rem;
  --p-toggleswitch-focus-ring-width: 0;
  --p-toggleswitch-focus-ring-color: transparent;
  --p-toggleswitch-border-width: 2px;
  --p-toggleswitch-border-color: var(--color-surface-50);
  --p-toggleswitch-background: var(--color-surface-800);
  --p-toggleswitch-checked-background: var(--color-surface-800);
  --p-toggleswitch-checked-border-color: var(--color-surface-50);
  --p-toggleswitch-handle-background: var(--color-surface-50);
  --p-toggleswitch-handle-checked-background: var(--color-surface-50);
  --p-toggleswitch-handle-border-color: transparent;
  --p-toggleswitch-handle-checked-border-color: transparent;
  --p-toggleswitch-handle-border-width: 0;
  --p-toggleswitch-handle-border-radius: 50%;
  --p-toggleswitch-handle-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  --p-toggleswitch-handle-checked-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  --p-toggleswitch-hover-border-color: var(--color-surface-50);
  --p-toggleswitch-checked-hover-border-color: var(--color-surface-50);
  --p-toggleswitch-hover-background: var(--color-surface-800);
  --p-toggleswitch-checked-hover-background: var(--color-surface-800);
  --p-toggleswitch-handle-hover-background: var(--color-surface-50);
  --p-toggleswitch-handle-checked-hover-background: var(--color-amber-500);
  --p-toggleswitch-handle-hover-color: var(--color-amber-500);
  --p-toggleswitch-handle-checked-hover-color: var(--color-amber-500);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
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

/* Styles pour le graphique */
.chart-container {
  position: relative;
  height: 500px;
  width: 100%;
}

.chart-container canvas {
  width: 100% !important;
  height: 100% !important;
}

/* Styles pour les camemberts */
.pie-charts-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 1024px) {
  .pie-charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .pie-charts-grid {
    grid-template-columns: 1fr;
  }
}

.pie-chart-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pie-chart-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.pie-chart-container {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-chart-container canvas {
  max-width: 100%;
  max-height: 100%;
}

@media (max-width: 640px) {
  .pie-chart-container {
    width: 150px;
    height: 150px;
  }
}

/* Styles pour les boutons d'export */
.export-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100px;
  height: 36px;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 8px;
  border: none !important;
  color: white !important;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.export-btn:hover::before {
  left: 100%;
}

/* Bouton Excel */
.export-excel {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 50%, #81C784 100%) !important;
}

.export-excel:hover {
  background: linear-gradient(135deg, #5CBF60 0%, #76CB7A 50%, #91D794 100%) !important;
}

/* Bouton PDF */
.export-pdf {
  background: linear-gradient(135deg, #E53E3E 0%, #F56565 50%, #FC8181 100%) !important;
}

.export-pdf:hover {
  background: linear-gradient(135deg, #EF4E4E 0%, #F97171 50%, #FC8B8B 100%) !important;
}

.export-text {
  color: white;
  font-weight: 500;
}

@media (max-width: 640px) {
  .export-btn {
    width: 80px;
    height: 32px;
    font-size: 0.8rem;
  }
  
  .export-text {
    display: none;
  }
}

</style>
