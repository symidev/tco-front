import { apiClient } from '@/lib/utils';

export const comparoService = {
  /**
   * Récupère la liste de tous les comparos de l'utilisateur
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getAllComparos() {
    return apiClient.get('/api/tco/comparo');
  },

  /**
   * Récupère les informations d'un comparo spécifique par son UUID
   * @param {string} uuid - L'identifiant unique du comparo
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getComparoByUuid(uuid) {
    return apiClient.get(`/api/tco/comparo/${uuid}`);
  }
};
