import apiService from './apiService';

export const comparoService = {
  /**
   * Récupère la liste de tous les comparos de l'utilisateur
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getAllComparos() {
    return apiService.get('/api/tco/comparo');
  },

  /**
   * Récupère les informations d'un comparo spécifique par son UUID
   * @param {string} uuid - L'identifiant unique du comparo
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getComparoByUuid(uuid) {
    return apiService.get(`/api/tco/comparo/${uuid}`) ;
  },

  /**
   * Supprime un comparo spécifique par son UUID
   * @param {string} uuid - L'identifiant unique du comparo
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  deleteComparoByUuid(uuid) {
    return apiService.delete(`/api/tco/comparo/${uuid}`) ;
  },

  /**
   * Crée un nouveau comparo
   * @param {Object} data - Les données du comparo à créer
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  createComparo(data) {
    return apiService.post('/api/tco/comparo', data, {
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    });
  },

  /**
   * Met à jour un comparo existant
   * @param {string} uuid - L'identifiant unique du comparo
   * @param {Object} data - Les données à mettre à jour
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  updateComparo(uuid, data) {
    return apiService.patch(`/api/tco/comparo/${uuid}`, data, {
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    });
  },

  /**
   * Récupère les informations d'un véhicule spécifique par son UUID
   * @param {string} comparoUuid - L'identifiant unique du comparo
   * @param {string} vehiculeUuid - L'identifiant unique du véhicule
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getVehiculeByUuid(comparoUuid, vehiculeUuid) {
    return apiService.get(`/api/tco/comparo/${comparoUuid}/vehicules/${vehiculeUuid}`);
  },

  /**
   * Crée un nouveau véhicule dans un comparo
   * @param {string} comparoUuid - L'identifiant unique du comparo
   * @param {Object} data - Les données du véhicule à créer
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  createVehicule(comparoUuid, data) {
    return apiService.post(`/api/tco/comparo/${comparoUuid}/vehicule`, data, {
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    });
  },

  /**
   * Met à jour un véhicule existant
   * @param {string} comparoUuid - L'identifiant unique du comparo
   * @param {string} vehiculeUuid - L'identifiant unique du véhicule
   * @param {Object} data - Les données à mettre à jour
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  updateVehicule(comparoUuid, vehiculeUuid, data) {
    return apiService.patch(`/api/tco/comparo/${comparoUuid}/vehicules/${vehiculeUuid}`, data, {
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    });
  },

  /**
   * Supprime un véhicule spécifique par son UUID
   * @param {string} comparoUuid - L'identifiant unique du comparo
   * @param {string} vehiculeUuid - L'identifiant unique du véhicule
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  deleteVehiculeByUuid(comparoUuid, vehiculeUuid) {
    return apiService.delete(`/api/tco/comparo/${comparoUuid}/vehicules/${vehiculeUuid}`);
  }
};
