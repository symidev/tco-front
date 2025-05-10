<script setup>
import { ref, onMounted } from 'vue';
import { comparoService } from '@/services/api/comparoService';
import { cn } from '@/lib/utils';
import Button from "primevue/button"

// États réactifs
const comparos = ref([]);
const loading = ref(false);
const error = ref(null);

// Fonction pour récupérer les comparos
const fetchComparos = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await comparoService.getAllComparos();
    comparos.value = response.data;
    console.log('Résultat des comparos:', comparos.value);
  } catch (err) {
    error.value = 'Erreur lors du chargement des comparos: ' + (err.message || 'Erreur inconnue');
    console.error('Erreur lors du chargement des comparos:', err);
  } finally {
    loading.value = false;
  }
};

// Équivalent à mounted dans l'option API
onMounted(() => {
  fetchComparos();
});
</script>

<template>
  <div :class="cn('comparos-container', 'p-6')">
    <h1 class="text-2xl font-bold mb-6">Mes Comparos</h1>
    <div class="flex justify-center items-center py-8">
      <Button label="Verify" />
    </div>
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="loading">Chargement en cours...</div>
    </div>

    <div v-else-if="error" class="alert alert-error alert-soft my-4">
      {{ error }}
    </div>

    <div v-else class="comparos-list grid gap-4">
      <!-- Ici, vous pourriez ajouter l'affichage des comparos si nécessaire -->
      <div v-if="comparos.length === 0" class="text-center py-8 text-gray-500">
        Aucun comparo trouvé.
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <!-- head -->
          <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Job</th>
            <th>Favorite Color</th>
          </tr>
          </thead>
          <tbody>
          <!-- row 1 -->
          <tr>
            <th>1</th>
            <td>Cy Ganderton</td>
            <td>Quality Control Specialist</td>
            <td>Blue</td>
          </tr>
          <!-- row 2 -->
          <tr>
            <th>2</th>
            <td>Hart Hagerty</td>
            <td>Desktop Support Technician</td>
            <td>Purple</td>
          </tr>
          <!-- row 3 -->
          <tr>
            <th>3</th>
            <td>Brice Swyre</td>
            <td>Tax Accountant</td>
            <td>Red</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comparos-container {
  min-height: 60vh;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.comparos-list {
  margin-top: 20px;
}
</style>
