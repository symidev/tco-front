import apiService from './apiService';

export const calculateurTaxesService = {
  /**
   * Calcule les taxes d'un véhicule
   * @param {Object} data - Les données pour le calcul des taxes
   * @param {string} data.typeFiscal - Type fiscal (VP/VU/VF)
   * @param {number} data.co2 - Émissions de CO2 en g/km
   * @param {string} data.energie - Type d'énergie (ESSENCE/DIESEL/E85/HEV/PHEV/MHEV/BEV)
   * @param {number} data.poids - Poids du véhicule (PVOM) en kg
   * @param {number} data.duree - Durée en mois
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  calculateTaxes(data) {
    return apiService.post('/api/calculateur-taxe', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};