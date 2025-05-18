/**
 * Plugin Vuex pour gérer les événements d'authentification
 * Ce plugin réagit aux changements d'état d'authentification et déclenche
 * le chargement ou la réinitialisation des données du site en conséquence
 */
export const authPlugin = store => {
  let previousAuthState = false
  let isInitialLoad = true

  // Détecter l'état initial d'authentification
  store.subscribe((mutation, state) => {
    // Ignorer le traitement initial pour éviter les appels en double
    if (isInitialLoad) {
      isInitialLoad = false
      previousAuthState = store.getters['auth/isAuthenticated']
      return
    }

    const isAuthenticated = store.getters['auth/isAuthenticated']

    // Détecter un changement d'état d'authentification (connexion)
    if (isAuthenticated && !previousAuthState) {
      previousAuthState = true
      // Charger les données du site quand l'utilisateur se connecte
      setTimeout(() => store.dispatch('siteData/fetchSiteData'), 100)
    }

    // Détecter un changement d'état d'authentification (déconnexion)
    if (!isAuthenticated && previousAuthState) {
      previousAuthState = false
      // Effacer les données du site quand l'utilisateur se déconnecte
      store.dispatch('siteData/resetData')
    }
  })
}
