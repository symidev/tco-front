# 🔵 FRONTEND GUIDE - TCO Vue 3 SPA

> **Document pour développeurs Frontend Vue 3**
> **Mis à jour:** 2026-03-09
> **Tech Stack:** Vue 3, Vite, Vuex 4, Tailwind CSS 4, PrimeVue 4

---

## 📌 COMMANDES ESSENTIELLES

```bash
# Développement (HTTPS port 5174)
npm run dev

# Production build + déploiement vers public_html/
npm run build

# Preview build production local
npm run preview

# Installation dépendances
npm install
```

---

## 🏗️ ARCHITECTURE GLOBALE

```
App.vue (composant racine)
   │
   └─→ Systèmes de Layouts (dynamiques)
   │      ├─ DefaultLayout      (utilisateurs authentifiés)
   │      │   ├─ Navbar
   │      │   ├─ Sidebar
   │      │   └─ <RouterView>
   │      │
   │      ├─ NoAuthLayout       (pages login/register)
   │      │   └─ <RouterView>
   │      │
   │      └─ EmptyLayout        (pages spéciales)
   │          └─ <RouterView>
   │
   └─→ Store Vuex (gestion d'état)
          ├─ auth/           (JWT, tokens, login)
          ├─ user/           (profil utilisateur)
          └─ siteData/       (configurations globales)
```

---

## 🔐 AUTHENTIFICATION JWT

### Flux Complet

```
1. Utilisateur → LoginView.vue
2. Saisit login + password
3. POST /jwt/token + Basic Auth header
4. Serveur retourne: { token, refresh_token }
5. Client:
   - Décode JWT
   - Extrait roles (comparo, catalogue)
   - Stocke localStorage + Vuex store
   - Ajoute header Bearer automatiquement
6. Router redirect vers /comparos ou /catalogues
```

### JWT Payload Structure

```javascript
{
  sub: "user-id",
  exp: 1234567890,           // Expiration timestamp
  iat: 1234567800,           // Création timestamp
  jti: "unique-jwt-id",
  drupal: {
    uid: 123,                    // Drupal user ID
    name: "user@email.com",      // Email
    roles: ["comparo", "catalogue"],  // Rôles
    nbMaxComparos: 10,           // Limite comparos
    nbMaxVehicules: 100,         // Limite véhicules
    logo: "https://...",         // URL logo client
    isDefault: "15%",            // IS défaut
    chargePatronaleDefault: "45%"  // Charges patronales défaut
  }
}
```

### Gestion Token Expirant

```javascript
// Automatique via interceptor response (apiService)
//
// Quand token expire (403):
// 1. POST /jwt/refresh avec refresh_token
// 2. Obtient nouveau access token
// 3. Réessaye requête originale
// 4. Si succès second: rechargement siteData
// 5. Si fail second: logout + redirect /login?reason=se
```

### Auto-connexion

```javascript
// Route: /autoconnect/:token?
// Utile pour liens de connexion auto dans emails

// Flux:
// 1. Page AutoConnectView reçoit token
// 2. POST /jwt/refreshByJwt
// 3. Obtient access + refresh tokens
// 4. Flag isAutoConnect = true
// 5. Peut forcer changement mot de passe
//    PATCH /api/change-password/reset
```

---

## 📦 VUEX STORE (Gestion d'État)

### 3 Modules Principaux

#### **1. Module `auth/`** - Authentification JWT

**État:**
```javascript
{
  token: null,              // JWT access token
  refreshToken: null,       // Refresh token
  tokenInfo: { ... },       // JWT payload décodé
  user: null,               // Données user complètes
  error: null,              // Message erreur
  loading: false,           // En cours de chargement
  isAutoConnect: false      // Flag auto-connexion
}
```

**Actions Principales:**
```javascript
// Login
await store.dispatch('auth/login', { login, password })
// POST /jwt/token avec Basic Auth
// Returns: { success, error?, noSubscription? }

// Auto-connect
await store.dispatch('auth/autoConnect', { token })
// POST /jwt/refreshByJwt

// Rafraîchir token
await store.dispatch('auth/refreshToken')
// POST /jwt/refresh avec refresh_token

// Logout
store.commit('auth/clearAuth')
// Vide localStorage + state
```

**Utilisation dans composant:**
```vue
<script setup>
import { useStore } from 'vuex'

const store = useStore()
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
const userRoles = computed(() => store.state.auth.tokenInfo?.drupal?.roles || [])

const handleLogin = async (credentials) => {
  const result = await store.dispatch('auth/login', credentials)
  if (result.success) {
    router.push('/comparos')
  }
}
</script>
```

#### **2. Module `user/`** - Profil Utilisateur

**État:**
```javascript
{
  user: { /* profil complet */ },
  loading: false,
  error: null
}
```

**Actions:**
```javascript
// Charger profil
await store.dispatch('user/fetchUserProfile')
// GET /api/user

// Mettre à jour profil
await store.dispatch('user/updateUserProfile', userData)
// POST /api/user/update
// Accepte: FormData (fichiers) ou JSON

// Changer mot de passe
await store.dispatch('user/changePassword', {
  currentPassword: '...',
  newPassword: '...'
})

// Changer mot de passe post auto-connect
await store.dispatch('user/changePasswordAfterAutoConnect', {
  newPassword: '...'
})
```

**Structure Profil:**
```javascript
{
  uid: 123,
  email: 'user@email.com',

  // Entreprise
  field_user_raison_sociale: 'Acme Corp',
  field_user_siret: '12345678901234',
  field_user_is: '15%',
  field_user_charge_patronale: '45%',
  field_user_logo: File,

  // Contact commercial
  field_commercial_nom: 'Dupont',
  field_commercial_prenom: 'Jean',
  field_commercial_fonction: 'Acheteur flotte',
  field_commercial_tel: '+33...',
  field_commercial_rue: 'Rue X',
  field_commercial_cp: '75001',
  field_commercial_ville: 'Paris',

  // Contact comptable (optionnel, même structure)
  field_comptable_nom: '...',
  // ...

  // Préférences
  field_user_connaissance: ['option1', 'option2'],
  field_user_connaissance_autre: 'Texte libre',
  field_user_offre: ['offre1', 'offre2']
}
```

#### **3. Module `siteData/`** - Configurations Globales

**État:**
```javascript
{
  data: null,           // Données globales site
  loading: false,
  error: null,
  lastUpdated: timestamp  // Cache (5 min)
}
```

**Actions:**
```javascript
// Charger données (si nécessaire)
await store.dispatch('siteData/fetchSiteData')
// GET /api/shareData

// Charger si nécessaire (smart fetch)
await store.dispatch('siteData/getSiteDataIfNeeded')
// Logique: fetch seulement si:
//   - Utilisateur authentifié
//   - Données manquantes OU périmées (> 5 min)
//   - Pas en cours de chargement
```

**Données Contenues:**
```javascript
{
  configurations: {
    carburant: { diesel: 1.5, essence: 1.6, ... },
    taxes: { co2Min: 95, ... },
    calculs: { tva: 0.20, isDefault: 0.15, ... },
    ...
  },
  marques: [
    { id: 1, label: 'Peugeot', logo: '...' },
    ...
  ],
  modeles: [
    { id: 1, label: 'Partner', marqueId: 1 },
    ...
  ]
}
```

---

## 🛣️ ROUTER & PROTECTION

### Routes Protégées

```javascript
// Guard principal: beforeEach()
// Règles:
// 1. Route sans token + meta.requiresAuth → /login
// 2. Token existant + /login → /comparos (ou /catalogues)
// 3. Routes API: /api/* nécessitent token

// Redirection intelligente racine:
path: '/',
redirect: (to) => {
  const roles = [...]  // Extract from JWT
  if (roles.includes('catalogue')) return '/catalogues'
  return '/comparos'
}
```

### Meta Données Routes

```javascript
{
  path: '/comparos',
  name: 'comparos',
  component: ComparosView,
  meta: {
    requiresAuth: true,           // Protection
    layout: 'DefaultLayout',       // Layout utilisé
    permissions: ['comparo']       // Rôles requis
  }
}
```

---

## 📋 COMPOSANTS PRINCIPAUX

### Layouts

**DefaultLayout.vue** (117 lignes)
- Pour pages authentifiées
- Sidebar + Navbar + contenu
- Responsive (drawer mobile)
- Mode sombre forcé

**NoAuthLayout.vue** (35 lignes)
- Pages login/register
- Layout centré simple
- Mode clair

**EmptyLayout.vue** (9 lignes)
- Layout minimal
- Utilisé pour pages spéciales

### Composants Réutilisables

**DataTableComparo.vue**
- Tableau comparatifs
- Pagination, tri
- Menu contextuel

**DataTableCatalogue.vue**
- Tableau catalogues
- Structure similaire

**SiteDataLoader.vue**
- Wrapper pour charger siteData
- États: loading, error, content
- Slots nommés

**UserProfile.vue**
- Gestion profil utilisateur
- Multi-sections (entreprise, contacts)
- Upload logo

---

## 🎨 STYLES & THEMING

### PrimeVue Theme

**Configuration (main.js):**
```javascript
// Thème "tcoTheme" personnalisé
// Basé sur: Nora preset
// Couleur primaire: Amber (or/jaune)
// Mode: dark (forcé)

// Customisations par composant:
// - formField: padding 0.4rem
// - button: padding 0.4rem
// - card: padding 1.5rem
// - datatable: styling dark
// ... 30+ composants customisés
```

### Tailwind CSS

**Configuration (tailwind.config.js):**
```javascript
// Content: ./src/**/*.{vue,js}
// Theme: palette gris personnalisée (50-950)
// DaisyUI: désactivé (conflits avec PrimeUI)

// Classes utiles:
// .page-container    - max-width 1200px + centered
// .page-header       - gradient + padding
// .section-card      - gradient surface-800
// .stat-card         - mini stats
// Animations: slideInUp, comparison-slideIn/fadeIn
```

### Responsive Design

```css
/* Mobile first approach */
@media (max-width: 768px) {
  /* 2 colonnes stats */
  .stats-grid { grid-template-columns: repeat(2, 1fr) }
}

@media (max-width: 480px) {
  /* 1 colonne stats */
  .stats-grid { grid-template-columns: 1fr }
  /* Drawer sidebar */
  .sidebar { position: fixed }
}
```

---

## 🔌 SERVICES API

### Centralisation via `apiService.js`

```javascript
// Instance axios de base
// baseURL = import.meta.env.VITE_API_BASE_URL
// Intercepteurs: request/response
// Gestion automatique JWT header
```

### Services Disponibles

**comparoService.js** (6 endpoints)
```javascript
getAllComparos()
getComparoByUuid(uuid)
deleteComparoByUuid(uuid)
createComparo(data)
updateComparo(uuid, data)
getComparoAnalyseByUuid(uuid)
analyzeComparo(uuid, data?)

getVehiculeByUuid(comparoUuid, vehiculeUuid)
createVehicule(comparoUuid, data)
updateVehicule(comparoUuid, vehiculeUuid, data)
deleteVehiculeByUuid(comparoUuid, vehiculeUuid)
```

**catalogueService.js** (3 sections)
```javascript
// Catalogues
getAllCatalogues()
getCatalogueByUuid(uuid)
createCatalogue(data)
updateCatalogue(uuid, data)
deleteCatalogueByUuid(uuid)

// Catégories
getCategoriesByCatalogueUuid(catUuid)
getCategorieByUuid(catUuid, catecUuid)
createCategorie(catUuid, data)
updateCategorie(catUuid, catecUuid, data)
deleteCategorieByUuid(catUuid, catecUuid)

// Véhicules
getVehiculesByCategorieUuid(catUuid, catecUuid)
getVehiculeByUuid(catUuid, catecUuid, vUuid)
createVehicule(catUuid, catecUuid, data)
updateVehicule(catUuid, catecUuid, vUuid, data)
deleteVehiculeByUuid(catUuid, catecUuid, vUuid)

// Analyse
getCatalogueAnalyseByUuid(uuid)
analyzeCatalogue(uuid, data?)
generateCataloguePdf(uuid)
```

**siteDataService.js**
```javascript
getShareData()  // GET /api/shareData
```

**calculateurTaxesService.js**
```javascript
calculateTaxes(data: {
  typeFiscal: 'VP|VU|VF',
  co2: number,
  energie: 'ESSENCE|DIESEL|E85|HEV|PHEV|MHEV|BEV',
  poids: number,
  duree: number
})
```

**calculetteAenService.js**
```javascript
calculateAen(data: {
  carburant: string,
  isBEV: boolean,
  isEcoScore: boolean,
  loyer: number,
  prixVehicule: number,
  remise: number
})
```

### Intercepteurs API

**Requête:**
- Ajoute token JWT en header Authorization
- Skip pour routes /jwt/token et /jwt/refresh

**Réponse:**
- Gère erreurs 403 (token expiré)
- Rafraîchit token automatiquement
- Réessaye requête originale
- Logout si échec second

---

## 🧩 COMPOSABLES (Logique Réutilisable)

### useSiteData.js

```javascript
export function useSiteData() {
  const store = useStore()

  return {
    data: computed(() => store.getters['siteData/getData']),
    loading: computed(() => store.getters['siteData/isLoading']),
    error: computed(() => store.getters['siteData/hasError']),
    fetchSiteData: () => store.dispatch('siteData/fetchSiteData'),
    getSiteDataIfNeeded: () => ...,
    resetSiteData: () => ...
  }
}

// Usage
const { data, loading, fetchSiteData } = useSiteData()
```

### useUserProfile.js

```javascript
export function useUserProfile(toast) {
  const formData = ref({ /* initial */ })
  const isSaving = ref(false)

  const saveProfile = async () => { ... }
  const validateForm = () => { ... }

  return { formData, isSaving, saveProfile, validateForm }
}

// Usage
const { formData, saveProfile } = useUserProfile(toast)
```

---

## 📖 FLUX UTILISATEUR COURANT

### 1. **Login → Accueil**
```
1. User accède https://localhost:5174
2. Guard vérifie token
3. Si absent → /login
4. Saisit credentials
5. Store dispatch auth/login
6. POST /jwt/token + Basic Auth
7. Reçoit { token, refresh_token }
8. Stocke localStorage + Vuex
9. Redirect /comparos (ou /catalogues selon rôles)
10. Charge siteData
11. Navbar affiche logo client
```

### 2. **Créer Comparo**
```
1. Clic button "Créer comparo" → /comparo/add
2. Remplit form (titre, etc)
3. Submit → POST /api/tco/comparo
4. Vérifie limite nbMaxComparos
5. Success → redirect /comparo/{uuid}/vehicules
6. Ajoute véhicules
7. Analyse → /comparo/{uuid}/analyse
```

### 3. **Éditer Profil**
```
1. Menu user → /account
2. Affiche UserProfile multi-sections
3. Édite infos entreprise/contacts
4. Upload logo
5. Submit → POST /api/user/update (FormData)
6. Success → toast message
7. Refresh données locales
```

### 4. **Refresh Token Automatique**
```
1. API call → Response 403
2. Interceptor détecte 403
3. POST /jwt/refresh avec refresh_token
4. Reçoit nouveau access token
5. Stocke Vuex + localStorage
6. Réessaye requête originale
7. Success → continue normal
```

---

## 🚨 POINTS D'ATTENTION

### ✋ Avant de Commencer

- [ ] Lire PROJECT_OVERVIEW.md (contexte projet)
- [ ] Comprendre JWT flow (auth store)
- [ ] Tester login/logout
- [ ] Vérifier CORS depuis API backend
- [ ] Examiner structure Vuex (3 modules)
- [ ] Consulter dossier views/ (22 pages)

### 🐛 Problèmes Courants

| Problème | Cause | Solution |
|----------|-------|----------|
| 403 Forbidden boucle | Token invalide | localStorage clear + relogin |
| CSS Tailwind non applié | Classe pas dans content config | Ajouter pattern à `content: []` |
| PrimeVue non stylisé | Mode sombre pas appliqué | Vérifier `.dark` sur `<html>` |
| Route protégée accessible | Guard pas exécuté | Vérifier `meta.requiresAuth: true` |
| Sidebar fermée mobile | Logique responsive | Vérifier `onMounted` screen check |
| API appel échoue | Endpoint inexistant | Vérifier backend module activé |

### 📝 Code Standards

```javascript
// ✓ BON
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])

// ✗ MAUVAIS
const isAuth = computed(() => store.state.auth.token !== null)

// Raison: Utiliser getters pour encapsulation
```

```vue
<!-- ✓ BON -->
<template>
  <div class="page-container">
    <div class="flex gap-4">
      <PrimeButton label="Action" />
    </div>
  </div>
</template>

<!-- ✗ MAUVAIS -->
<template>
  <div style="max-width: 1200px; margin: 0 auto;">
    <div class="flex" style="gap: 1rem;">
      <button>Action</button>
    </div>
  </div>
</template>

<!-- Raison: Utiliser Tailwind + composants UI -->
```

---

## 🔄 GIT WORKFLOW

```bash
# Créer branche feature
git checkout -b feature/nom-feature

# Développer + commit
git add .
git commit -m "feat: description changement"

# Push
git push origin feature/nom-feature

# Créer PR sur main
# (automatique via GitHub CLI ou web interface)

# Après merge
git checkout main
git pull
```

---

## 📚 RESSOURCES

- **Vue 3:** https://vuejs.org
- **Vuex 4:** https://vuex.vuejs.org
- **Vite:** https://vite.dev
- **PrimeVue:** https://primevue.org
- **Tailwind:** https://tailwindcss.com

---

## 💬 QUESTIONS?

Consulter:
1. PROJECT_OVERVIEW.md (vue globale)
2. Ce fichier (frontend spécifique)
3. Code source (src/ avec noms explicites)
4. CLAUDE.md (instructions globales)

---

**Document généré:** 2026-03-09
**Version:** 1.0
**Status:** ✅ Complet
