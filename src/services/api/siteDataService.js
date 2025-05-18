import apiService from './apiService';

export const siteDataService = {
  /**
   * Récupère les données partagées du site
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getShareData() {
    return apiService.get('/api/shareData');
  }
};
