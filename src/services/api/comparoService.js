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
  deleteComparoByUuid(uuid) {
    return apiService.delete(`/api/tco/comparo/${uuid}`) ;
  }
};
