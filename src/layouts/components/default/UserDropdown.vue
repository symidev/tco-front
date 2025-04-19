<!-- UserDropdown.vue -->
<script setup>
import { UserPen, Key, LogOut, CircleUser } from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

// Computed property to check if we have user data
const user = computed(() => store.state.user?.user)

// État pour gérer le chargement des données sans clignotement
const isLoading = ref(false)

// État pour gérer l'ouverture du menu
const isMenuOpen = ref(false)

// État pour savoir si on est sur mobile ou desktop
const isMobile = ref(false)

// Vérifier si on est sur mobile
const checkIfMobile = () => {
  isMobile.value = window.innerWidth < 768 // Considère les écrans < 768px comme mobiles
}

// Ajouter un listener pour détecter les changements de taille d'écran
onMounted(() => {
  //loadUserProfile()
  checkIfMobile()
  window.addEventListener('resize', checkIfMobile)
})

// Charge silencieusement les données du profil utilisateur au survol du menu
const loadUserProfile = async () => {
  if (!user.value && !isLoading.value) {
    isLoading.value = true
    await store.dispatch('user/fetchUserProfile')
    isLoading.value = false
  }
}

// Fonction pour ouvrir/fermer le menu au clic
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value

  // Charger les données du profil si le menu s'ouvre
  /*if (isMenuOpen.value) {
    loadUserProfile()
  }*/
}

// Fonction de déconnexion
const logout = () => {
  store.dispatch('auth/logout')
  router.push({ name: 'login' })
}
</script>

<template>
  <div
      class="dropdown-end relative"
      :class="{
      'group': !isMobile,
      'is-open': isMenuOpen
    }"
      @mouseenter="!isMobile && loadUserProfile()"
      @click="toggleMenu"
  >

    <div role="button" class="btn btn-ghost btn-circle avatar flex items-center justify-center">
      <div class="w-10 rounded-full flex items-center justify-center">
        <CircleUser class="w-8 h-8"/>
      </div>
    </div>
    <ul
        class="menu menu-sm dropdown-content bg-base-200 rounded-box z-40 gap-2 w-38 p-2 shadow transition-all duration-200 absolute top-full right-0"
        :class="{
        'desktop-menu': !isMobile,
        'mobile-menu': isMobile,
        'visible opacity-100': isMenuOpen && isMobile,
        'invisible opacity-0': !isMenuOpen && isMobile
      }"
    >
      <li>
        <RouterLink :to="{ name: 'profile' }" @click="isMenuOpen = false">
          <UserPen class="inline-block mr-2"/>
          Mon profil
        </RouterLink>
      </li>
      <li>
        <RouterLink :to="{ name: 'password' }" @click="isMenuOpen = false">
          <Key class="inline-block mr-2"/>
          Mot de passe
        </RouterLink>
      </li>
      <li>
        <a @click.prevent="logout">
          <LogOut class="inline-block mr-2"/>
          Déconnexion
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Comportement pour mobile (par clic) */
.mobile-menu {
  transition: opacity 0.2s, visibility 0.2s;
}

/* Comportement pour desktop (par survol) */
.desktop-menu {
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s, visibility 0.2s;
  transition-delay: 50ms;
}

/* Sur desktop: au survol du conteneur, affiche le menu */
.group:hover .desktop-menu {
  visibility: visible;
  opacity: 1;
  transition-delay: 0ms;
}

/* Pour s'assurer que le menu reste visible quand on passe la souris dessus (desktop) */
.desktop-menu:hover {
  visibility: visible;
  opacity: 1;
}

/* Fermer le menu si on clique à l'extérieur (ajoutez un gestionnaire JS si nécessaire) */
@media (max-width: 767px) {
  .is-open .mobile-menu {
    visibility: visible;
    opacity: 1;
  }
}
</style>
