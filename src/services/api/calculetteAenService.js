import apiService from './apiService';

export const calculetteAenService = {
  /**
   * Calcule les charges patronales AEN
   * @param {Object} data - Les données pour le calcul AEN
   * @param {string} data.carburant - Type de carburant ('essence', 'diesel', etc.)
   * @param {boolean} data.isBEV - Véhicule BEV (Battery Electric Vehicle)
   * @param {boolean} data.isEcoScore - Véhicule Eco Scoré
   * @param {number} data.loyer - Loyer mensuel en euros
   * @param {number} data.prixVehicule - Prix du véhicule en euros
   * @param {number} data.remise - Remise en pourcentage
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  calculateAen(data) {
    return apiService.post('/api/calculette-aen', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};