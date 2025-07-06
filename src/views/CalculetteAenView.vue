<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { Calculator, Euro, Percent, Car, TrendingUp, FileText, CheckCircle } from 'lucide-vue-next';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import FloatLabel from 'primevue/floatlabel';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import ProgressSpinner from 'primevue/progressspinner';
import { calculetteAenService } from '@/services/api/calculetteAenService';

const toast = useToast();

// États réactifs pour le formulaire
const formData = ref({
  prixVehicule: null,
  remise: 0,
  loyer: null,
  isBEV: false,
  isEcoScore: false,
  repartition: 'pro'
});

// Options pour les listes déroulantes
const ouiNonOptions = [
  { label: 'Non', value: false },
  { label: 'Oui', value: true }
];

const repartitionOptions = [
  { label: 'Pro', value: 'pro' },
  { label: 'Pro et Privée', value: 'perso_pro' },
];

// États pour l'affichage des résultats
const tauxAenPrix = ref(null);
const tauxAenLoyer = ref(null);
const basePrix = ref(null);
const baseLoyer = ref(null);
const loading = ref(false);
const hasResults = ref(false);

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
      repartition: formData.value.repartition,
      isBEV: formData.value.isBEV,
      isEcoScore: formData.value.isEcoScore,
      loyer: formData.value.loyer,
      prixVehicule: formData.value.prixVehicule,
      remise: formData.value.remise
    };

    const response = await calculetteAenService.calculateAen(requestData);

    // Mise à jour des résultats avec les données de l'API
    tauxAenPrix.value = response.data.taux_prix;
    basePrix.value = response.data.montant_prix;
    tauxAenLoyer.value = response.data.taux_loyer;
    baseLoyer.value = response.data.montant_loyer;
    hasResults.value = true;
  } catch (error) {
    console.error('Erreur lors du calcul AEN:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error?.response?.data?.error || 'Une erreur est survenue lors du calcul',
      life: 3000
    });

    // Réinitialiser les résultats en cas d'erreur
    tauxAenPrix.value = null;
    tauxAenLoyer.value = null;
    basePrix.value = null;
    baseLoyer.value = null;
    hasResults.value = false;
  } finally {
    loading.value = false;
  }
};

// Fonction pour réinitialiser le formulaire
const resetForm = () => {
  formData.value = {
    prixVehicule: null,
    remise: 0,
    loyer: null,
    isBEV: false,
    isEcoScore: false,
    repartition: 'pro'
  };
  tauxAenPrix.value = null;
  tauxAenLoyer.value = null;
  basePrix.value = null;
  baseLoyer.value = null;
  hasResults.value = false;
};


// Validation du formulaire
const isFormValid = computed(() => {
  return formData.value.prixVehicule !== null &&
         formData.value.remise !== null &&
         formData.value.loyer !== null;
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
              Calculette AEN
            </h1>
            <p class="page-subtitle">Calculez les charges patronales sur AEN</p>
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
                <!-- Ligne des champs numériques -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Prix du véhicule -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                      <IconField>
                        <InputIcon>
                          <Euro class="h-4 w-4"/>
                        </InputIcon>
                        <InputNumber
                          id="prixVehicule"
                          v-model="formData.prixVehicule"
                          mode="currency"
                          currency="EUR"
                          locale="fr-FR"
                          :min="0"
                          fluid
                          required
                        />
                      </IconField>
                      <label for="prixVehicule" class="form-label">Prix du véhicule € TTC (options incluses) *</label>
                    </FloatLabel>
                  </div>

                  <!-- Remise -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                      <IconField>
                        <InputIcon>
                          <Percent class="h-4 w-4"/>
                        </InputIcon>
                        <InputNumber
                          id="remise"
                          v-model="formData.remise"
                          suffix="%"
                          :min="0"
                          :max="100"
                          :minFractionDigits="1"
                          :maxFractionDigits="1"
                          fluid
                          required
                        />
                      </IconField>
                      <label for="remise" class="form-label">Remise (tripartites + concession) en % *</label>
                    </FloatLabel>
                  </div>

                  <!-- Loyer -->
                  <div class="form-field">
                    <FloatLabel variant="in">
                      <IconField>
                        <InputIcon>
                          <Euro class="h-4 w-4"/>
                        </InputIcon>
                        <InputNumber
                          id="loyer"
                          v-model="formData.loyer"
                          mode="currency"
                          currency="EUR"
                          locale="fr-FR"
                          :min="0"
                          fluid
                          required
                        />
                      </IconField>
                      <label for="loyer" class="form-label">Loyer € TTC (avec assurance) *</label>
                    </FloatLabel>
                  </div>
                </div>

                <!-- Ligne des options -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Select BEV -->
                  <div class="form-field">
                    <label class="form-label">Véhicule BEV</label>
                    <Select
                      v-model="formData.isBEV"
                      :options="ouiNonOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Sélectionnez"
                      class="w-full"
                    />
                  </div>

                  <!-- Select Eco Scoré -->
                  <div class="form-field">
                    <label class="form-label">Véhicule Eco Scoré</label>
                    <Select
                      v-model="formData.isEcoScore"
                      :options="ouiNonOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Sélectionnez"
                      class="w-full"
                    />
                  </div>

                  <!-- Select Repartition -->
                  <div class="form-field">
                    <label class="form-label">Répartition</label>
                    <Select
                      v-model="formData.repartition"
                      :options="repartitionOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Sélectionnez un type"
                      class="w-full"
                    />
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
              <h2>Charges patronales sur AEN calculées</h2>
            </div>
          </div>

          <div class="section-content">
            <div class="results-container">
              <!-- Grille des résultats -->
              <div class="results-grid">
                <!-- Bloc Prix -->
                <div class="result-block result-block-primary">
                  <div class="result-block-header">
                    <div class="result-block-icon">
                      <Car class="icon" />
                    </div>
                    <div class="result-block-title">Basé sur le prix du véhicule (avec remise)</div>
                  </div>
                  <div class="result-block-content">
                    <div class="result-main">
                      <div class="result-amount">{{ basePrix !== null ? basePrix.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0,00 €' }}</div>
                    </div>
                    <div class="result-secondary">
                      <div class="result-value">{{ tauxAenPrix !== null ? tauxAenPrix : 0 }}%</div>
                      <div class="result-label">Taux AEN</div>
                    </div>
                  </div>
                </div>

                <!-- Bloc Loyer -->
                <div class="result-block result-block-secondary">
                  <div class="result-block-header">
                    <div class="result-block-icon">
                      <FileText class="icon" />
                    </div>
                    <div class="result-block-title">Basé sur loyer mensuel du véhicule</div>
                  </div>
                  <div class="result-block-content">
                    <div class="result-main">
                      <div class="result-amount">{{ baseLoyer !== null ? baseLoyer.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '0,00 €' }}</div>
                    </div>
                    <div class="result-secondary">
                      <div class="result-value">{{ tauxAenLoyer !== null ? tauxAenLoyer : 0 }}%</div>
                      <div class="result-label">Taux AEN</div>
                    </div>
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

/* Désactiver les animations de hover sur les blocs */
.section-card:hover {
  transform: none !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
}

/* Animation d'apparition */
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

/* Container des résultats */
.results-container {
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-50) 100%);
  border: 1px solid var(--primary-200);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Header des résultats */
.results-header {
  padding: 2rem 2rem 1rem;
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  color: white;
  text-align: center;
}

.results-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.results-title h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.results-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.results-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 500;
}

/* Grille des résultats */
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

/* Blocs de résultats */
.result-block {
  background: var(--surface-0);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.result-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.result-block-primary {
  border-color: var(--primary-300);
}

.result-block-secondary {
  border-color: var(--green-300);
}

.result-block-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.result-block-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  color: white;
}

.result-block-secondary .result-block-icon {
  background: linear-gradient(135deg, var(--green-500) 0%, var(--green-600) 100%);
}

.result-block-icon .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.result-block-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.result-block-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.result-main {
  flex: 1;
}

.result-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.result-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.result-secondary {
  text-align: right;
}

.result-amount {
  font-size: 2rem;
  font-weight: 800;
  color: var(--green-600);
  margin-bottom: 0.25rem;
}

.result-sublabel {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Footer des résultats */
.results-footer {
  padding: 1.5rem 2rem;
  background: var(--surface-100);
  border-top: 1px solid var(--surface-200);
}

.results-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--surface-0);
  border-radius: 6px;
  border: 1px solid var(--surface-200);
}

.summary-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color-secondary);
}

.summary-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-color);
}

/* Responsive */
@media (max-width: 768px) {
  .results-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .results-header {
    padding: 1.5rem 1rem 1rem;
  }

  .results-title h3 {
    font-size: 1.25rem;
  }

  .result-block {
    padding: 1rem;
  }

  .result-block-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .result-secondary {
    text-align: left;
  }

  .results-summary {
    flex-direction: column;
    gap: 0.75rem;
  }
}

/* Dark mode */
:root.dark .results-container {
  background: linear-gradient(135deg, var(--surface-900) 0%, var(--surface-800) 100%);
  border-color: var(--surface-700);
}

:root.dark .results-header {
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
}

:root.dark .result-block {
  background: var(--surface-900);
  border-color: var(--surface-700);
}

:root.dark .result-block-primary {
  border-color: var(--primary-600);
}

:root.dark .result-block-secondary {
  border-color: var(--green-600);
}

:root.dark .results-footer {
  background: var(--surface-800);
  border-color: var(--surface-700);
}

:root.dark .summary-item {
  background: var(--surface-800);
  border-color: var(--surface-700);
}
</style>
