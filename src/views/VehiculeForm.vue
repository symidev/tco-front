<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import FloatLabel from 'primevue/floatlabel';
import { comparoService } from '@/services/api/comparoService';
import { Save, RefreshCw, Car, PlugZap, Droplets, Gauge, Weight, Factory, Fuel, Euro, Percent } from 'lucide-vue-next';
import { useStore } from 'vuex';

const props = defineProps({
  mode: {
    type: String,
    default: 'add'
  },
  comparoUuid: {
    type: String,
    required: true
  },
  vehiculeUuid: {
    type: String,
    default: null
  }
});

const router = useRouter();
const store = useStore();
const toast = useToast();

const loading = ref(false);
const saving = ref(false);

const formData = ref({
  marque: null,
  modele: null,
  finition: '',
  puissance: '',
  cylindree: '',
  energie: null,
  boite: null,
  conso_carburant: '',
  conso_electrique: '',
  poids: '',
  co2: '',
  prix: '',
  prix_options: '',
  remise: '',
  loueur: null,
  loyer: '',
  entretien: '',
  pneumatique: '',
  gardiennage_pneus: '',
  vehicule_relais: '',
  assu_rc: '',
  assu_dommages: '',
  perte_fi: '',
  carte_carb: '',
  carte_elec: '',
  badge_telepeage: '',
  vignette_critair: '',
  autre_cout: ''
});

// Liste des marques et modèles
const marques = computed(() => {
  const allMarques = store.getters['siteData/getNestedData']('marques') || [];

  // Si aucune énergie sélectionnée, retourner toutes les marques
  if (!formData.value.energie) {
    return allMarques;
  }

  // Filtrer les marques selon l'énergie sélectionnée
  const energieKey = formData.value.energie.key;
  const thermalEnergies = ['essence', 'diesel', 'e85', 'mhev'];

  return allMarques.filter(marque => {
    if (!marque.modeles || marque.modeles.length === 0) return false;

    return marque.modeles.some(modele => {
      if (thermalEnergies.includes(energieKey)) {
        // Pour les énergies thermiques, inclure les modèles avec energie null ou correspondante
        return !modele.energie || modele.energie === energieKey;
      } else {
        // Pour les autres énergies, chercher la correspondance exacte
        return modele.energie === energieKey;
      }
    });
  });
});

// Liste des modèles filtrée selon la marque sélectionnée
const modeles = computed(() => {
  if (!formData.value.marque) return [];

  const selectedMarque = marques.value.find(m => m.id === formData.value.marque.id);
  let availableModeles = selectedMarque?.modeles || [];

  // Si une énergie est sélectionnée, filtrer les modèles
  if (formData.value.energie) {
    const energieKey = formData.value.energie.key;
    const thermalEnergies = ['essence', 'diesel', 'e85', 'mhev'];

    availableModeles = availableModeles.filter(modele => {
      if (thermalEnergies.includes(energieKey)) {
        // Pour les énergies thermiques, inclure les modèles avec energie null ou correspondante
        return !modele.energie || modele.energie === energieKey;
      } else {
        // Pour les autres énergies, chercher la correspondance exacte
        return modele.energie === energieKey;
      }
    });
  }

  return availableModeles;
});

// Fonction pour formater l'affichage des modèles (title + moteur)
const getModeleDisplayName = (modele) => {
  if (!modele) return '';
  if (modele.moteur && modele.moteur.trim() !== '') {
    return `${modele.title} - ${modele.moteur}`;
  }
  return modele.title;
};

// Liste des énergies
const energies = computed(() => {
  return store.getters['siteData/getNestedData']('vehicule-energie') || [];
});

// Liste des boites
const boites = computed(() => {
  return store.getters['siteData/getNestedData']('vehicule-boite') || [];
});

// Liste des loueurs
const loueurs = computed(() => {
  return store.getters['siteData/getNestedData']('loueur') || [];
});

// Gestion de la visibilité des champs en fonction de l'énergie
const shouldHideMotorFields = computed(() => {
  if (!formData.value.energie) return false;
  const electricTypes = ['bev', 'phev', 'hev', 'hydrogen'];
  return electricTypes.includes(formData.value.energie.key);
});

const shouldHideConsoCarburant = computed(() => {
  if (!formData.value.energie) return false;
  return formData.value.energie.key === 'bev';
});

const shouldHideConsoElectrique = computed(() => {
  if (!formData.value.energie) return false;
  const thermalTypes = ['essence', 'diesel', 'e85', 'mhev'];
  return thermalTypes.includes(formData.value.energie.key);
});

const pageTitle = computed(() => {
  return props.mode === 'edit' ? 'Éditer un véhicule' : 'Créer un véhicule';
});

const comparoName = ref('')

// Fonction pour réinitialiser les champs énergie et consommation
const resetEnergieAndConsommation = () => {
  formData.value.energie = null;
  formData.value.conso_electrique = '';
  formData.value.conso_carburant = '';
};

// Fonction pour récupérer les infos du modèle sélectionné
const updateFormDataFromModele = (selectedModele) => {
  if (selectedModele) {
    // Récupérer les infos de consommation du modèle
    if (selectedModele.conso_elec) {
      formData.value.conso_electrique = selectedModele.conso_elec.toString();
    }
    if (selectedModele.conso_thermique) {
      formData.value.conso_carburant = selectedModele.conso_thermique.toString();
    }

    // Récupérer l'énergie du modèle et la sélectionner
    if (selectedModele.energie) {
      const selectedEnergie = energies.value.find(e => e.key === selectedModele.energie);
      if (selectedEnergie) {
        formData.value.energie = selectedEnergie;
      }
    }
  }
};

// Watcher pour le changement d'énergie - réinitialise marque et modèle
watch(() => formData.value.energie, (newEnergie, oldEnergie) => {
  // Si l'énergie change, réinitialiser marque et modèle
  if (oldEnergie && newEnergie?.key !== oldEnergie?.key) {
    formData.value.marque = null;
    formData.value.modele = null;
    formData.value.conso_electrique = '';
    formData.value.conso_carburant = '';
  }

  // Vider les champs de consommation qui deviennent désactivés
  if (newEnergie) {
    if (newEnergie.key === 'bev') {
      formData.value.conso_carburant = '';
    }
    if (['e85', 'diesel', 'essence'].includes(newEnergie.key)) {
      formData.value.conso_electrique = '';
    }
  }
}, { deep: true });

// Watcher pour vider les champs masqués
watch(() => shouldHideMotorFields.value, (shouldHide) => {
  if (shouldHide) {
    formData.value.finition = '';
    formData.value.cylindree = '';
    formData.value.puissance = '';
  }
});

watch(() => shouldHideConsoCarburant.value, (shouldHide) => {
  if (shouldHide) {
    formData.value.conso_carburant = '';
  }
});

watch(() => shouldHideConsoElectrique.value, (shouldHide) => {
  if (shouldHide) {
    formData.value.conso_electrique = '';
  }
});

// Watcher pour le changement de marque - réinitialise modèle
watch(() => formData.value.marque, (newMarque, oldMarque) => {
  // Si la marque change, réinitialiser le modèle
  if (oldMarque && newMarque?.id !== oldMarque?.id) {
    formData.value.modele = null;
  }
}, { deep: true });

// Watcher pour le changement de modèle
watch(() => formData.value.modele, (newModele, oldModele) => {
  // Si le modèle change, réinitialiser d'abord les champs
  if (oldModele && newModele?.id !== oldModele?.id) {
    resetEnergieAndConsommation();
  }

  // Puis appliquer les nouvelles valeurs du modèle sélectionné
  if (newModele) {
    updateFormDataFromModele(newModele);
  }

  // Si le modèle est supprimé/null, réinitialiser les champs
  if (!newModele && oldModele) {
    resetEnergieAndConsommation();
  }
}, { deep: true });


const loadVehiculeData = async () => {
  if (props.mode !== 'edit' || !props.vehiculeUuid) return;

  loading.value = true;
  try {
    const response = await comparoService.getVehiculeByUuid(props.comparoUuid, props.vehiculeUuid);
    const vehicule = response.data;
    comparoName.value = vehicule.comparoName;

    const selectedMarque = marques.value.find(m => m.id === vehicule.marque.id);
    const selectedEnergie = energies.value.find(e => e.key === vehicule.energie);
    const selectedBoite = boites.value.find(b => b.key === vehicule.boite);
    const selectedLoueur = vehicule.loueur ? loueurs.value.find(l => l.id === vehicule.loueur.id) : null;

    formData.value = {
      marque: selectedMarque || null,
      finition: vehicule.finition || '',
      puissance: vehicule.puissance || '',
      cylindree: vehicule.cylindree || '',
      energie: selectedEnergie || null,
      boite: selectedBoite || null,
      conso_carburant: vehicule.conso_carb || '',
      conso_electrique: vehicule.conso_kwh || '',
      poids: vehicule.pvom || '',
      co2: vehicule.co2 || '',
      prix: vehicule.prix || '',
      prix_options: vehicule.prix_options || '',
      remise: vehicule.remise || '',
      loueur: selectedLoueur,
      loyer: vehicule.loyer_financier || '',
      entretien: vehicule.entretien || '',
      pneumatique: vehicule.pneumatique || '',
      gardiennage_pneus: vehicule.pneumatique_garde || '',
      vehicule_relais: vehicule.vehicule_relais || '',
      assu_rc: vehicule.assurance_rc || '',
      assu_dommages: vehicule.assurance_dommage || '',
      perte_fi: vehicule.perte_fi || '',
      carte_carb: vehicule.carte_carb || '',
      carte_elec: vehicule.carte_elec || '',
      badge_telepeage: vehicule.badge_telepeage || '',
      vignette_critair: vehicule.vignette_critair || '',
      autre_cout: vehicule.autre_cout || ''
    };
    const selectedModele = modeles.value.find(m => m.id === vehicule.modele.id);
    formData.value.modele = selectedModele || null;
  } catch (error) {
    console.log(error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données du véhicule',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  loadVehiculeData();
};

const validateForm = () => {
  // Vérifier les champs obligatoires
  if (!formData.value.marque || !formData.value.modele || !formData.value.energie || !formData.value.loueur || !formData.value.loyer) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Veuillez remplir tous les champs obligatoires',
      life: 3000
    });
    return false;
  }

  // Vérifier les champs de consommation en fonction de l'énergie
  if (!shouldHideConsoCarburant.value && formData.value.conso_carburant === '') {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Veuillez renseigner la consommation de carburant',
      life: 3000
    });
    return false;
  }

  if (!shouldHideConsoElectrique.value && formData.value.conso_electrique === '') {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Veuillez renseigner la consommation électrique',
      life: 3000
    });
    return false;
  }

  // Vérifier que les champs numériques contiennent des valeurs numériques valides
  if (formData.value.puissance && !/^[0-9]+$/.test(formData.value.puissance)) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'La puissance doit être un nombre',
      life: 3000
    });
    return false;
  }

  if (formData.value.cylindree === '') {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Veuillez renseigner la cylindrée',
      life: 3000
    });
    return false;
  }

  if (!shouldHideConsoCarburant.value && formData.value.conso_carburant && !/^[0-9]+(\.[0-9]+)?$/.test(formData.value.conso_carburant)) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'La consommation de carburant doit être un nombre',
      life: 3000
    });
    return false;
  }

  if (!shouldHideConsoElectrique.value && formData.value.conso_electrique && !/^[0-9]+(\.[0-9]+)?$/.test(formData.value.conso_electrique)) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'La consommation électrique doit être un nombre',
      life: 3000
    });
    return false;
  }

  if (formData.value.co2 && !/^[0-9]+$/.test(formData.value.co2)) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'La valeur CO2 doit être un nombre',
      life: 3000
    });
    return false;
  }

  if (formData.value.poids && !/^[0-9]+$/.test(formData.value.poids)) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Le poids doit être un nombre',
      life: 3000
    });
    return false;
  }

  // Validation du prix
  if (!formData.value.prix || !/^[0-9]+(\.[0-9]+)?$/.test(formData.value.prix)) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Le prix du véhicule doit être un nombre (avec décimale possible)',
      life: 3000
    });
    return false;
  }

  // Validation du prix des options (si renseigné)
  if (formData.value.prix_options && !/^[0-9]+(\.[0-9]+)?$/.test(formData.value.prix_options)) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Le prix des options doit être un nombre (avec décimale possible)',
      life: 3000
    });
    return false;
  }

  // Validation de la remise (si renseignée)
  if (formData.value.remise && !/^[0-9]+(\.[0-9]+)?$/.test(formData.value.remise)) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'La remise doit être un nombre (avec décimale possible)',
      life: 3000
    });
    return false;
  }

  // Validation du loyer (obligatoire)
  if (!formData.value.loyer || !/^[0-9]+(\.[0-9]+)?$/.test(formData.value.loyer)) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Le loyer doit être un nombre (avec décimale possible)',
      life: 3000
    });
    return false;
  }

  // Validation des autres coûts financiers (si renseignés)
  const financialFields = ['entretien', 'pneumatique', 'gardiennage_pneus', 'vehicule_relais',
    'assu_rc', 'assu_dommages', 'perte_fi', 'carte_carb', 'carte_elec', 'badge_telepeage', 'vignette_critair', 'autre_cout'];

  for (const field of financialFields) {
    if (formData.value[field] && !/^[0-9]+(\.[0-9]+)?$/.test(formData.value[field])) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: `Le champ "${field.replace('_', ' ')}" doit être un nombre (avec décimale possible)`,
        life: 3000
      });
      return false;
    }
  }

  return true;
};

const saveVehicule = async () => {
  if (!validateForm()) return;

  saving.value = true;
  try {

    const vehiculeData = {
      marque: {target_id: formData.value.marque?.id},
      modele: {target_id: formData.value.modele?.id},
      finition: formData.value.finition,
      puissance: formData.value.puissance,
      cylindree: formData.value.cylindree,
      energie: formData.value.energie?.key,
      boite: formData.value.boite?.key,
      conso_carb: formData.value.conso_carburant,
      conso_kwh: formData.value.conso_electrique,
      pvom: formData.value.poids,
      co2: formData.value.co2,
      prix: formData.value.prix,
      prix_options: formData.value.prix_options || '0',
      remise: formData.value.remise || '0',
      loueur: {target_id: formData.value.loueur?.id},
      loyer: formData.value.loyer,
      entretien: formData.value.entretien || '0',
      pneumatique: formData.value.pneumatique || '0',
      gardiennage_pneus: formData.value.gardiennage_pneus || '0',
      vehicule_relais: formData.value.vehicule_relais || '0',
      assu_rc: formData.value.assu_rc || '0',
      assu_dommages: formData.value.assu_dommages || '0',
      perte_fi: formData.value.perte_fi || '0',
      carte_carb: formData.value.carte_carb || '0',
      carte_elec: formData.value.carte_elec || '0',
      badge_telepeage: formData.value.badge_telepeage || '0',
      vignette_critair: formData.value.vignette_critair || '0',
      autre_cout: formData.value.autre_cout || '0'
    };

    let response;

    if (props.mode === 'edit') {
      response = await comparoService.updateVehicule(props.comparoUuid, props.vehiculeUuid, vehiculeData);
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Le véhicule a été mis à jour avec succès',
        life: 3000
      });
    } else {
      response = await comparoService.createVehicule(props.comparoUuid, vehiculeData);
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Le véhicule a été créé avec succès',
        life: 3000
      });
    }

    // Redirection vers la liste des véhicules du comparo
    router.push(`/comparo/${props.comparoUuid}/vehicules`);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du véhicule:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error?.response?.data?.error || 'Une erreur est survenue lors de la sauvegarde',
      life: 3000
    });
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadVehiculeData();
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
              {{ pageTitle }}
            </h1>
            <p class="page-subtitle">
              <span v-if="comparoName">Pour le comparo {{ comparoName }}</span>
              <span v-else>{{ props.mode === 'edit' ? 'Modifiez les caractéristiques de votre véhicule' : 'Ajoutez un nouveau véhicule à votre comparo' }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <ProgressSpinner class="loading-spinner" />
          <p class="loading-text">Chargement du véhicule...</p>
        </div>
      </div>

      <!-- Formulaire -->
      <div v-else class="content-grid animate-slide-in-up">
        <form @submit.prevent="saveVehicule">
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <Car class="section-icon" />
              <h2>Informations générales</h2>
            </div>
          </div>

          <div class="section-content">
            <div class="p-6">
              <div class="grid gap-6 mb-4">
                <!-- Énergie en premier, sur 1 colonne -->
                <div class="form-field">
                  <FloatLabel variant="in">
                  <IconField>
                    <InputIcon>
                      <Fuel class="h-4 w-4"/>
                    </InputIcon>
                    <Select
                      id="energie"
                      v-model="formData.energie"
                      :options="energies"
                      optionLabel="label"
                      class="w-full"
                      required
                    />
                  </IconField>
                  <label for="energie" class="form-label">Énergie *</label>
                </FloatLabel>
              </div>

                <!-- Marque et Modèle sur une nouvelle ligne -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Marque -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Car class="h-4 w-4"/>
                      </InputIcon>
                      <Select
                        id="marque"
                        v-model="formData.marque"
                        :options="marques"
                        optionLabel="name"
                        :autoFilterFocus="true"
                        :filter="true"
                        class="w-full"
                        required
                        :disabled="!formData.energie"
                      />
                    </IconField>
                    <label for="marque" class="form-label">Marque *</label>
                  </FloatLabel>
                </div>

                  <!-- Modèle -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Car class="h-4 w-4"/>
                      </InputIcon>
                      <Select
                        id="modele"
                        v-model="formData.modele"
                        :options="modeles"
                        optionLabel="title"
                        :filter="true"
                        class="w-full"
                        :autoFilterFocus="true"
                        required
                        :disabled="!formData.marque"
                      >
                        <template #option="{ option }">
                          <div>{{ getModeleDisplayName(option) }}</div>
                        </template>
                        <template #value="{ value }">
                          <div v-if="value">{{ getModeleDisplayName(value) }}</div>
                        </template>
                      </Select>
                    </IconField>
                    <label for="modele" class="form-label">Modèle *</label>
                  </FloatLabel>
                </div>
              </div>

              <!-- Champs moteur (masqués pour bev, phev, hev, hydrogen) -->
              <div v-if="!shouldHideMotorFields" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <!-- Finition -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Car class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="finition"
                        v-model="formData.finition"
                        fluid
                      />
                    </IconField>
                    <label for="finition" class="form-label">Finition</label>
                  </FloatLabel>
                </div>

                  <!-- Cylindrée -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Factory class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                          id="cylindree"
                          v-model="formData.cylindree"
                          fluid
                          required
                      />
                    </IconField>
                    <label for="cylindree" class="form-label">Cylindrée *</label>
                  </FloatLabel>
                </div>

                  <!-- Puissance -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Gauge class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="puissance"
                        v-model="formData.puissance"
                        required
                        fluid
                      />
                    </IconField>
                    <label for="puissance" class="form-label">Puissance *</label>
                  </FloatLabel>
                </div>
              </div>

              <!-- Consommations (masquage conditionnel) -->
              <div class="grid gap-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Conso carburant (masqué pour bev) -->
                  <div v-if="!shouldHideConsoCarburant" class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Droplets class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="conso_carburant"
                        v-model="formData.conso_carburant"
                        fluid
                      />
                    </IconField>
                    <label for="conso_carburant" class="form-label">Conso carburant (L/100km)*</label>
                  </FloatLabel>
                </div>

                  <!-- Conso électrique (masqué pour essence, diesel, e85, mhev) -->
                  <div v-if="!shouldHideConsoElectrique" class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <PlugZap class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="conso_electrique"
                        v-model="formData.conso_electrique"
                        @input="e => formData.conso_electrique = e.target.value.replace(/[^0-9.]/g, '')"
                        fluid
                      />
                    </IconField>
                    <label for="conso_electrique" class="form-label">Conso électrique (kWh)*</label>
                  </FloatLabel>
                </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Car class="h-4 w-4"/>
                      </InputIcon>
                      <Select
                          id="boite"
                          v-model="formData.boite"
                          :options="boites"
                          optionLabel="label"
                          class="w-full"
                          required
                      />
                    </IconField>
                    <label for="boite" class="form-label">Boite *</label>
                  </FloatLabel>
                </div>

                  <!-- Poids -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Weight class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="poids"
                        v-model="formData.poids"
                        fluid
                        required
                      />
                    </IconField>
                    <label for="poids" class="form-label">Poids (PVOM) *</label>
                  </FloatLabel>
                </div>

                  <!-- CO2 -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Fuel class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="co2"
                        v-model="formData.co2"
                        required
                        fluid
                      />
                    </IconField>
                    <label for="co2" class="form-label">CO2 *</label>
                  </FloatLabel>
                </div>
              </div>

              <!-- Prix, Prix options et Remise -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <!-- Prix -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="prix"
                        v-model="formData.prix"
                        required
                        fluid
                      />
                    </IconField>
                    <label for="prix" class="form-label">Prix du véhicule *</label>
                  </FloatLabel>
                </div>

                  <!-- Prix options -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="prix_options"
                        v-model="formData.prix_options"
                        fluid
                      />
                    </IconField>
                    <label for="prix_options" class="form-label">Prix des options</label>
                  </FloatLabel>
                </div>

                  <!-- Remise -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Percent class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="remise"
                        v-model="formData.remise"
                        fluid
                      />
                    </IconField>
                    <label for="remise" class="form-label">Remise (%)</label>
                  </FloatLabel>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <Euro class="section-icon" />
              <h2>Financement (coût mensuel)</h2>
            </div>
          </div>

          <div class="section-content">
            <div class="p-6">
            <div class="grid gap-6 mb-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Loueur -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Car class="h-4 w-4"/>
                      </InputIcon>
                      <Select
                        id="loueur"
                        v-model="formData.loueur"
                        :options="loueurs"
                        optionLabel="name"
                        :filter="true"
                        :autoFilterFocus="true"
                        class="w-full"
                        required
                      />
                    </IconField>
                    <label for="loueur" class="form-label">Loueur *</label>
                  </FloatLabel>
                </div>

                  <!-- Loyer -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="loyer"
                        v-model="formData.loyer"
                        required
                        fluid
                      />
                    </IconField>
                    <label for="loyer" class="form-label">Loyer *</label>
                  </FloatLabel>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <!-- Entretien -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="entretien"
                        v-model="formData.entretien"
                        fluid
                      />
                    </IconField>
                    <label for="entretien" class="form-label">Entretien</label>
                  </FloatLabel>
                </div>

                  <!-- Pneumatique -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="pneumatique"
                        v-model="formData.pneumatique"
                        fluid
                      />
                    </IconField>
                    <label for="pneumatique" class="form-label">Pneumatique</label>
                  </FloatLabel>
                </div>

                  <!-- Gardiennage pneus -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="gardiennage_pneus"
                        v-model="formData.gardiennage_pneus"
                        fluid
                      />
                    </IconField>
                    <label for="gardiennage_pneus" class="form-label">Gardiennage pneus</label>
                  </FloatLabel>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <!-- Véhicule relais -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="vehicule_relais"
                        v-model="formData.vehicule_relais"
                        fluid
                      />
                    </IconField>
                    <label for="vehicule_relais" class="form-label">Véhicule relais</label>
                  </FloatLabel>
                </div>

                  <!-- Assurance RC -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="assu_rc"
                        v-model="formData.assu_rc"
                        fluid
                      />
                    </IconField>
                    <label for="assu_rc" class="form-label">Assurance RC</label>
                  </FloatLabel>
                </div>

                  <!-- Assurance dommages -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="assu_dommages"
                        v-model="formData.assu_dommages"
                        fluid
                      />
                    </IconField>
                    <label for="assu_dommages" class="form-label">Assurance dommages</label>
                  </FloatLabel>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <!-- Perte financière -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="perte_fi"
                        v-model="formData.perte_fi"
                        fluid
                      />
                    </IconField>
                    <label for="perte_fi" class="form-label">Perte financière</label>
                  </FloatLabel>
                </div>

                  <!-- Carte carburant -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="carte_carb"
                        v-model="formData.carte_carb"
                        fluid
                      />
                    </IconField>
                    <label for="carte_carb" class="form-label">Carte carburant</label>
                  </FloatLabel>
                </div>

                  <!-- Carte électrique -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="carte_elec"
                        v-model="formData.carte_elec"
                        fluid
                      />
                    </IconField>
                    <label for="carte_elec" class="form-label">Carte électrique</label>
                  </FloatLabel>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <!-- Badge Télépéage -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="badge_telepeage"
                        v-model="formData.badge_telepeage"
                        fluid
                      />
                    </IconField>
                    <label for="badge_telepeage" class="form-label">Badge Télépéage</label>
                  </FloatLabel>
                </div>

                  <!-- Vignette Critair -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="vignette_critair"
                        v-model="formData.vignette_critair"
                        fluid
                      />
                    </IconField>
                    <label for="vignette_critair" class="form-label">Vignette Critair</label>
                  </FloatLabel>
                </div>

                  <!-- Autre coût -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                    <IconField>
                      <InputIcon>
                        <Euro class="h-4 w-4"/>
                      </InputIcon>
                      <InputText
                        id="autre_cout"
                        v-model="formData.autre_cout"
                        fluid
                      />
                    </IconField>
                    <label for="autre_cout" class="form-label">Autre coût</label>
                  </FloatLabel>
                </div>
              </div>
            </div>
              </div>

              <!-- Boutons d'action -->
              <div class="flex flex-row flex-wrap items-center justify-center sm:justify-between gap-4 mb-6 mx-6">
                <Button
                    type="button"
                    outlined
                    @click="router.push(`/comparo/${props.comparoUuid}/vehicules`)"
                    class="btn-primary w-[200px] min-w-[200px]"
                >
                  Retour Véhicules
                </Button>

                <Button
                    v-if="props.mode === 'edit'"
                    type="button"
                    outlined
                    severity="secondary"
                    @click="resetForm"
                    class="btn-primary w-[200px] min-w-[200px]"
                >
                  <RefreshCw class="h-4 w-4 mr-2"/>
                  Réinitialiser
                </Button>

                <Button
                    type="submit"
                    severity="primary"
                    :disabled="saving"
                    class="btn-primary w-[200px] min-w-[200px]"
                >
                  <ProgressSpinner v-if="saving" style="width:16px;height:16px" strokeWidth="8" class="mr-2"/>
                  <Save v-else class="h-4 w-4 mr-2"/>
                  {{ saving ? 'Enregistrement...' : 'Sauvegarder' }}
                </Button>
              </div>
            </div>
          </div>
        </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-inputtext),
:deep(.p-select),
:deep(.p-select-label) {
  width: 100%;
}

:deep([invalid="true"]),
:deep(.p-invalid) {
  border-color: var(--red-500) !important;
}
</style>
