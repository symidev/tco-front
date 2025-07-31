<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { Calculator, Euro, Car, TrendingUp, FileText, CheckCircle } from 'lucide-vue-next';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import FloatLabel from 'primevue/floatlabel';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import ProgressSpinner from 'primevue/progressspinner';
import { calculateurTaxesService } from '@/services/api/calculateurTaxesService';

const toast = useToast();

// États réactifs pour le formulaire
const formData = ref({
  typeFiscal: 'vp',
  co2: null,
  energie: null,
  poids: null,
  duree: 48,
  place: 5
});

// Options pour les listes déroulantes
const typeFiscalOptions = [
  { label: 'VP', value: 'vp' },
  { label: 'VU', value: 'vu' },
  { label: 'VF', value: 'vf' }
];

const energieOptions = [
  { label: 'ESSENCE', value: 'essence' },
  { label: 'DIESEL', value: 'diesel' },
  { label: 'E85', value: 'e85' },
  { label: 'HEV', value: 'hev' },
  { label: 'PHEV', value: 'phev' },
  { label: 'MHEV', value: 'mhev' },
  { label: 'BEV', value: 'bev' }
];

const placesOptions = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 }
];

// États pour l'affichage des résultats
const taxeCo2 = ref(null);
const taxePolluant = ref(null);
const taxeMasse = ref(null);
const malus = ref(null);
const loading = ref(false);
const hasResults = ref(false);

// Fonction pour scroller vers les résultats avec animation
const scrollToResults = () => {
  const resultsElement = document.querySelector('.section-card.animate-fade-in');
  if (resultsElement) {
    resultsElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

// Fonction pour calculer via l'API
const calculer = async () => {
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez remplir tous les champs obligatoires',
      life: 3000
    });
    return;
  }

  loading.value = true;

  try {
    const requestData = {
      typeFiscal: formData.value.typeFiscal,
      co2: formData.value.co2,
      energie: formData.value.energie,
      poids: formData.value.poids,
      duree: formData.value.duree,
      place: formData.value.place
    };

    const response = await calculateurTaxesService.calculateTaxes(requestData);

    // Mise à jour des résultats avec les données de l'API
    taxeCo2.value = response.data.taxe_co2;
    taxePolluant.value = response.data.taxe_polluant;
    taxeMasse.value = response.data.taxe_masse;
    malus.value = response.data.malus;
    hasResults.value = true;
    
    // Scroll vers les résultats après un court délai pour permettre l'affichage
    setTimeout(() => {
      scrollToResults();
    }, 100);
  } catch (error) {
    console.error('Erreur lors du calcul des taxes:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error?.response?.data?.error || 'Une erreur est survenue lors du calcul',
      life: 3000
    });

    // Réinitialiser les résultats en cas d'erreur
    taxeCo2.value = null;
    taxePolluant.value = null;
    taxeMasse.value = null;
    malus.value = null;
    hasResults.value = false;
  } finally {
    loading.value = false;
  }
};

// Fonction pour réinitialiser le formulaire
const resetForm = () => {
  formData.value = {
    typeFiscal: 'vp',
    co2: null,
    energie: null,
    poids: null,
    duree: 48,
    place: 5
  };
  taxeCo2.value = null;
  taxePolluant.value = null;
  taxeMasse.value = null;
  malus.value = null;
  hasResults.value = false;
};

// Validation du formulaire
const isFormValid = computed(() => {
  return formData.value.typeFiscal !== null &&
         formData.value.co2 !== null &&
         formData.value.energie !== null &&
         formData.value.poids !== null &&
         formData.value.duree !== null &&
         formData.value.place !== null;
});

// Calculs des totaux
const sousTotal = computed(() => {
  if (!hasResults.value) return 0;
  return (taxeCo2.value || 0) + (taxePolluant.value || 0);
});

const sousTotalMensuel = computed(() => {
  if (!hasResults.value || !formData.value.duree) return 0;
  return sousTotal.value / 12;
});

const malusLivraison = computed(() => {
  if (!hasResults.value) return 0;
  return (taxeMasse.value || 0) + (malus.value || 0);
});

const totalFiscalMensuel = computed(() => {
  if (!hasResults.value) return 0;
  return sousTotalMensuel.value + (malusLivraison.value / formData.value.duree);
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
              <Calculator class="title-icon" />
              Calculateur de taxes
            </h1>
            <p class="page-subtitle">Calculez les taxes fiscales de vos véhicules</p>
          </div>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="content-grid animate-slide-in-up">
        <!-- Section Formulaire -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <Calculator class="section-icon" />
              <h2>Saisie des informations</h2>
            </div>
          </div>

          <div class="section-content">
            <form @submit.prevent="calculer" class="p-6">
              <div class="grid gap-6 mb-4">
                <!-- Ligne des sélecteurs -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Type fiscal -->
                  <div class="form-field">
                    <label class="form-label">Type fiscal *</label>
                    <Select
                      v-model="formData.typeFiscal"
                      :options="typeFiscalOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Sélectionnez le type fiscal"
                      class="w-full"
                    />
                  </div>

                  <!-- Énergie -->
                  <div class="form-field">
                    <label class="form-label">Énergie *</label>
                    <Select
                      v-model="formData.energie"
                      :options="energieOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Sélectionnez l'énergie"
                      class="w-full"
                    />
                  </div>

                  <!-- Nombre de places -->
                  <div class="form-field">
                    <label class="form-label">Nb places du véhicule *</label>
                    <Select
                      v-model="formData.place"
                      :options="placesOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Sélectionnez"
                      class="w-full"
                    />
                  </div>
                </div>

                <!-- Ligne des champs numériques -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Poids du véhicule -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                      <InputNumber
                        id="poids"
                        v-model="formData.poids"
                        :min="0"
                        :step="100"
                        suffix=" kg"
                        fluid
                        required
                      />
                      <label for="poids" class="form-label">Poids du véhicule (PVOM) *</label>
                    </FloatLabel>
                  </div>

                  <!-- CO2 -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                      <InputNumber
                        id="co2"
                        v-model="formData.co2"
                        :min="0"
                        :max="500"
                        :step="1"
                        suffix=" g/km"
                        fluid
                        required
                      />
                      <label for="co2" class="form-label">Émissions de CO2 *</label>
                    </FloatLabel>
                  </div>

                  <!-- Durée -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                      <InputNumber
                        id="duree"
                        v-model="formData.duree"
                        :min="0"
                        :max="72"
                        :step="1"
                        suffix=" mois"
                        fluid
                        required
                      />
                      <label for="duree" class="form-label">Durée en mois *</label>
                    </FloatLabel>
                  </div>
                </div>
              </div>

              <!-- Boutons d'action -->
              <div class="flex flex-row flex-wrap items-center justify-center sm:justify-end gap-4 mt-6">
                <Button
                  type="button"
                  outlined
                  severity="secondary"
                  @click="resetForm"
                  class="btn-primary w-[200px] min-w-[200px]"
                >
                  Réinitialiser
                </Button>
                <Button
                  type="submit"
                  severity="primary"
                  :disabled="!isFormValid || loading"
                  class="btn-primary w-[200px] min-w-[200px]"
                >
                  <ProgressSpinner v-if="loading" style="width:16px;height:16px" strokeWidth="8" class="mr-2"/>
                  <Calculator v-else class="h-4 w-4 mr-2"/>
                  {{ loading ? 'Calcul...' : 'Calculer' }}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <!-- Section Résultats -->
        <div v-if="hasResults" class="section-card animate-fade-in">
          <div class="section-header">
            <div class="section-title">
              <CheckCircle class="section-icon text-green-500" />
              <h2>Résultats du calcul fiscal</h2>
            </div>
          </div>

          <div class="section-content">
            <div class="results-container">
              <!-- Section des 4 taxes principales -->
              <div class="taxes-section">
                <h3 class="section-subtitle">Taxes annuelles</h3>
                <div class="taxes-grid">
                  <!-- Taxes sur le CO2 -->
                  <div class="tax-card tax-card-primary">
                    <div class="tax-card-header">
                      <TrendingUp class="tax-icon" />
                      <span class="tax-title">Taxes sur le CO2</span>
                    </div>
                    <div class="tax-amount">{{ taxeCo2 !== null ? taxeCo2.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0,00 €' }}</div>
                    <div class="tax-label">Taxe annuelle</div>
                  </div>

                  <!-- Taxe Air sur les polluants -->
                  <div class="tax-card tax-card-secondary">
                    <div class="tax-card-header">
                      <Car class="tax-icon" />
                      <span class="tax-title">Taxe polluants</span>
                    </div>
                    <div class="tax-amount">{{ taxePolluant !== null ? taxePolluant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0,00 €' }}</div>
                    <div class="tax-label">Taxe annuelle</div>
                  </div>

                  <!-- Taxe à la masse -->
                  <div class="tax-card tax-card-warning">
                    <div class="tax-card-header">
                      <TrendingUp class="tax-icon" />
                      <span class="tax-title">Taxe à la masse</span>
                    </div>
                    <div class="tax-amount">{{ taxeMasse !== null ? taxeMasse.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0,00 €' }}</div>
                    <div class="tax-label">Une fois</div>
                  </div>

                  <!-- Malus -->
                  <div class="tax-card tax-card-danger">
                    <div class="tax-card-header">
                      <Car class="tax-icon" />
                      <span class="tax-title">Malus</span>
                    </div>
                    <div class="tax-amount">{{ malus !== null ? malus.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0,00 €' }}</div>
                    <div class="tax-label">Une fois</div>
                  </div>
                </div>
              </div>

              <!-- Section des totaux -->
              <div class="totals-section">
                <h3 class="section-subtitle">Totaux</h3>
                <div class="totals-grid">
                  <!-- Malus à payer à la livraison -->
                  <div class="total-card total-card-danger">
                    <div class="total-card-header">
                      <FileText class="total-icon" />
                      <span class="total-title">Malus à payer à la livraison</span>
                    </div>
                    <div class="total-amount">{{ malusLivraison.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }}</div>
                    <div class="total-label">Taxe à la masse + Malus</div>
                  </div>

                  <!-- Total fiscal mensualisé -->
                  <div class="total-card total-card-success">
                    <div class="total-card-header">
                      <Euro class="total-icon" />
                      <span class="total-title">Total fiscal mensualisé</span>
                    </div>
                    <div class="total-amount total-amount-large">{{ totalFiscalMensuel.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }}</div>
                    <div class="total-label">Taxes mensuelles + Malus mensualisé</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-inputtext),
:deep(.p-inputnumber),
:deep(.p-inputnumber-input) {
  width: 100%;
}

:deep([invalid="true"]),
:deep(.p-invalid) {
  border-color: var(--red-500) !important;
}

.section-card:hover {
  transform: none !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
}

.animate-fade-in {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.results-container {
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-50) 100%);
  border: 1px solid var(--primary-200);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 2rem;
}

/* Section des taxes */
.taxes-section {
  margin-bottom: 2rem;
}

.section-subtitle {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 1rem;
  text-align: center;
}

.taxes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.tax-card {
  background: var(--surface-0);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  text-align: center;
}

.tax-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.tax-card-primary {
  border-color: var(--primary-300);
}

.tax-card-secondary {
  border-color: var(--green-300);
}

.tax-card-warning {
  border-color: var(--orange-300);
}

.tax-card-danger {
  border-color: var(--red-300);
}

.tax-card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tax-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--primary-500);
}

.tax-card-secondary .tax-icon {
  color: var(--green-500);
}

.tax-card-warning .tax-icon {
  color: var(--orange-500);
}

.tax-card-danger .tax-icon {
  color: var(--red-500);
}

.tax-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.tax-amount {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.tax-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Section des totaux */
.totals-section {
  border-top: 1px solid var(--surface-200);
  padding-top: 2rem;
}

.totals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.total-card {
  background: var(--surface-0);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  text-align: center;
}

.total-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.total-card-danger {
  border-color: var(--red-300);
}

.total-card-success {
  border-color: var(--green-400);
  background: linear-gradient(135deg, var(--green-50) 0%, var(--surface-50) 100%);
}

.total-card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.total-icon {
  width: 2rem;
  height: 2rem;
  color: var(--red-500);
}

.total-card-success .total-icon {
  color: var(--green-600);
}

.total-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.total-amount {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.total-amount-large {
  font-size: 2.5rem;
  color: var(--green-600);
}

.total-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .results-container {
    padding: 1rem;
  }

  .taxes-grid {
    grid-template-columns: 1fr;
  }

  .totals-grid {
    grid-template-columns: 1fr;
  }

  .tax-card {
    padding: 1rem;
  }

  .total-card {
    padding: 1.5rem;
  }

  .tax-amount {
    font-size: 1.25rem;
  }

  .total-amount {
    font-size: 1.5rem;
  }

  .total-amount-large {
    font-size: 2rem;
  }
}

:root.dark .results-container {
  background: linear-gradient(135deg, var(--surface-900) 0%, var(--surface-800) 100%);
  border-color: var(--surface-700);
}

:root.dark .tax-card,
:root.dark .total-card {
  background: var(--surface-900);
  border-color: var(--surface-700);
}

:root.dark .tax-card-primary {
  border-color: var(--primary-600);
}

:root.dark .tax-card-secondary {
  border-color: var(--green-600);
}

:root.dark .tax-card-warning {
  border-color: var(--orange-600);
}

:root.dark .tax-card-danger {
  border-color: var(--red-600);
}

:root.dark .total-card-danger {
  border-color: var(--red-600);
}

:root.dark .total-card-success {
  border-color: var(--green-600);
  background: linear-gradient(135deg, var(--green-900) 0%, var(--surface-900) 100%);
}

:root.dark .totals-section {
  border-color: var(--surface-700);
}
</style>
