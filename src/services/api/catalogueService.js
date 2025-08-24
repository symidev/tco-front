import apiService from './apiService';

export const catalogueService = {
  // ==================== CATALOGUES ====================
  
  /**
   * Récupère la liste de tous les catalogues de l'utilisateur
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getAllCatalogues() {
    return apiService.get('/api/tco/catalogue');
  },

  /**
   * Récupère les informations d'un catalogue spécifique par son UUID
   * @param {string} uuid - L'identifiant unique du catalogue
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getCatalogueByUuid(uuid) {
    return apiService.get(`/api/tco/catalogue/${uuid}`);
  },

  /**
   * Supprime un catalogue spécifique par son UUID
   * @param {string} uuid - L'identifiant unique du catalogue
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  deleteCatalogueByUuid(uuid) {
    return apiService.delete(`/api/tco/catalogue/${uuid}`);
  },

  /**
   * Crée un nouveau catalogue
   * @param {Object} data - Les données du catalogue à créer
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  createCatalogue(data) {
    return apiService.post('/api/tco/catalogue', data, {
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    });
  },

  /**
   * Met à jour un catalogue existant
   * @param {string} uuid - L'identifiant unique du catalogue
   * @param {Object} data - Les données à mettre à jour
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  updateCatalogue(uuid, data) {
    return apiService.patch(`/api/tco/catalogue/${uuid}`, data, {
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    });
  },

  // ==================== CATÉGORIES ====================

  /**
   * Récupère la liste de toutes les catégories d'un catalogue
   * @param {string} catalogueUuid - L'identifiant unique du catalogue
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getCategoriesByCatalogueUuid(catalogueUuid) {
    return apiService.get(`/api/tco/catalogue/${catalogueUuid}/categories`);
  },

  /**
   * Récupère les informations d'une catégorie spécifique par son UUID
   * @param {string} catalogueUuid - L'identifiant unique du catalogue
   * @param {string} categorieUuid - L'identifiant unique de la catégorie
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getCategorieByUuid(catalogueUuid, categorieUuid) {
    return apiService.get(`/api/tco/catalogue/${catalogueUuid}/categories/${categorieUuid}`);
  },

  /**
   * Crée une nouvelle catégorie dans un catalogue
   * @param {string} catalogueUuid - L'identifiant unique du catalogue
   * @param {Object} data - Les données de la catégorie à créer
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  createCategorie(catalogueUuid, data) {
    return apiService.post(`/api/tco/catalogue/${catalogueUuid}/categorie`, data, {
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    });
  },

  /**
   * Met à jour une catégorie existante
   * @param {string} catalogueUuid - L'identifiant unique du catalogue
   * @param {string} categorieUuid - L'identifiant unique de la catégorie
   * @param {Object} data - Les données à mettre à jour
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  updateCategorie(catalogueUuid, categorieUuid, data) {
    return apiService.patch(`/api/tco/catalogue/${catalogueUuid}/categories/${categorieUuid}`, data, {
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    });
  },

  /**
   * Supprime une catégorie spécifique par son UUID
   * @param {string} catalogueUuid - L'identifiant unique du catalogue
   * @param {string} categorieUuid - L'identifiant unique de la catégorie
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  deleteCategorieByUuid(catalogueUuid, categorieUuid) {
    return apiService.delete(`/api/tco/catalogue/${catalogueUuid}/categories/${categorieUuid}`);
  },

  // ==================== VÉHICULES ====================

  /**
   * Récupère la liste de tous les véhicules d'une catégorie
   * @param {string} catalogueUuid - L'identifiant unique du catalogue
   * @param {string} categorieUuid - L'identifiant unique de la catégorie
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getVehiculesByCategorieUuid(catalogueUuid, categorieUuid) {
    return apiService.get(`/api/tco/catalogue/${catalogueUuid}/categories/${categorieUuid}/vehicules`);
  },

  /**
   * Récupère les informations d'un véhicule spécifique par son UUID
   * @param {string} catalogueUuid - L'identifiant unique du catalogue
   * @param {string} categorieUuid - L'identifiant unique de la catégorie
   * @param {string} vehiculeUuid - L'identifiant unique du véhicule
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getVehiculeByUuid(catalogueUuid, categorieUuid, vehiculeUuid) {
    return apiService.get(`/api/tco/catalogue/${catalogueUuid}/categories/${categorieUuid}/vehicules/${vehiculeUuid}`);
  },

  /**
   * Crée un nouveau véhicule dans une catégorie
   * @param {string} catalogueUuid - L'identifiant unique du catalogue
   * @param {string} categorieUuid - L'identifiant unique de la catégorie
   * @param {Object} data - Les données du véhicule à créer
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  createVehicule(catalogueUuid, categorieUuid, data) {
    return apiService.post(`/api/tco/catalogue/${catalogueUuid}/categories/${categorieUuid}/vehicule`, data, {
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    });
  },

  /**
   * Met à jour un véhicule existant
   * @param {string} catalogueUuid - L'identifiant unique du catalogue
   * @param {string} categorieUuid - L'identifiant unique de la catégorie
   * @param {string} vehiculeUuid - L'identifiant unique du véhicule
   * @param {Object} data - Les données à mettre à jour
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  updateVehicule(catalogueUuid, categorieUuid, vehiculeUuid, data) {
    return apiService.patch(`/api/tco/catalogue/${catalogueUuid}/categories/${categorieUuid}/vehicules/${vehiculeUuid}`, data, {
      headers: {
        'Content-Type': 'application/vnd.api+json'
      }
    });
  },

  /**
   * Supprime un véhicule spécifique par son UUID
   * @param {string} catalogueUuid - L'identifiant unique du catalogue
   * @param {string} categorieUuid - L'identifiant unique de la catégorie
   * @param {string} vehiculeUuid - L'identifiant unique du véhicule
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  deleteVehiculeByUuid(catalogueUuid, categorieUuid, vehiculeUuid) {
    return apiService.delete(`/api/tco/catalogue/${catalogueUuid}/categories/${categorieUuid}/vehicules/${vehiculeUuid}`);
  },

  // ==================== ANALYSE ====================

  /**
   * Récupère les informations d'analyse d'un catalogue spécifique par son UUID
   * @param {string} uuid - L'identifiant unique du catalogue
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  getCatalogueAnalyseByUuid(uuid) {
    return apiService.get(`/api/tco/catalogue/${uuid}/analyse`);
  },

  /**
   * Lance l'analyse d'un catalogue
   * @param {string} uuid - L'identifiant unique du catalogue
   * @param {Object} [data] - Les données optionnelles pour l'analyse
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  analyzeCatalogue(uuid, data = {}) {
    return apiService.post(`/api/tco/catalogue/${uuid}/analyse`, data);
  },

  /**
   * Génère le PDF d'analyse d'un catalogue
   * @param {string} uuid - L'identifiant unique du catalogue
   * @returns {Promise<Object>} Les données de réponse de l'API
   */
  generateCataloguePdf(uuid) {
    return apiService.post(`/api/tco/catalogue/${uuid}/pdf`);
  }
};