<!-- Sidebar.vue -->
<script setup>
import { Car, FileText, Book, BookOpen, Calculator, ChevronsLeft, BarChart3, Settings, Users, Building2, HelpCircle } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { computed, ref } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import apiService from '@/services/api/apiService'

const props = defineProps({
  isOpen: Boolean,
  isMobile: Boolean
})

const emit = defineEmits(['toggleSidebar', 'closeSidebar'])

// Récupérer la route active et le store
const route = useRoute()
const store = useStore()

// Fermer la sidebar lorsqu'un lien est cliqué (uniquement en mode mobile)
const closeSidebarOnMobile = () => {
  if (props.isMobile) {
    emit('closeSidebar')
  }
}

// Basculer l'état de la sidebar
const toggleSidebar = () => {
  emit('toggleSidebar')
}

// Vérifier si un lien est actif
const isActive = (path) => {
  // Pour les comparatifs, considérer comme actif toutes les routes /comparo*
  if (path === '/comparos') {
    return route.path === '/comparos' || route.path.startsWith('/comparo')
  }
  return route.path === path
}

// Fonction pour vérifier si l'utilisateur a les permissions nécessaires
const hasPermission = (permissions) => {
  // Si aucune permission n'est requise
  if (!permissions || permissions.length === 0) {
    return true
  }

  // Récupérer les rôles de l'utilisateur
  const userRoles = computed( () => store.state.auth?.tokenInfo?.drupal?.roles || [])
  // Vérifier que userRoles est bien un tableau
  if (!Array.isArray(userRoles.value)) {
    console.warn('Les rôles utilisateur ne sont pas dans un format valide');
    return false;
  }

  // Normalisation et comparaison insensible à la casse
  return permissions.some(permission => {
    if (typeof permission !== 'string') return false;
    const normalizedPermission = permission.trim().toLowerCase();
    return userRoles.value.some(role =>
        typeof role === 'string' && role.trim().toLowerCase() === normalizedPermission
    );
  });
}

// Configuration des groupes de menu
const menuGroups = [
  {
    title: '',
    items: [
      { path: '/comparos', icon: BarChart3, label: 'COMPARATIF véhicules', permissions: ['comparo', 'catalogue'] },
      { path: '/catalogues', icon: BookOpen, label: 'Catalogues de véhicules', permissions: ['catalogue'] },
      { path: '/calculette-aen', icon: Calculator, label: 'Calculette AEN', permissions: ['catalogue'] },
      { path: '/calculateur-taxes', icon: Calculator, label: 'Calculateur de taxes', permissions: ['catalogue'] }
    ]
  }
]

// Liste plate pour compatibilité (deprecated - utiliser menuGroups)
const allMenuItems = [
  { path: '/comparos', icon: BarChart3, label: 'COMPARATIF véhicules', permissions: ['comparo', 'catalogue'] },
  { path: '/catalogues', icon: BookOpen, label: 'Catalogues de véhicules', permissions: ['catalogue'] },
  { path: '/calculette-aen', icon: Calculator, label: 'Calculette AEN', permissions: ['catalogue'] },
  { path: '/calculateur-taxes', icon: Calculator, label: 'Calculateur de taxes', permissions: ['catalogue'] }
]

// Filtrer les éléments du menu selon les permissions de l'utilisateur
const menuItems = computed(() => {
  return allMenuItems.filter(item => hasPermission(item.permissions))
})

// Filtrer les groupes de menu selon les permissions
const filteredMenuGroups = computed(() => {
  return menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => hasPermission(item.permissions))
  })).filter(group => group.items.length > 0)
})

// Dialog d'assistance
const showAssistanceDialog = ref(false)
const assistanceForm = ref({
  sujet: '',
  message: ''
})
const isSubmitting = ref(false)
const toast = useToast()

// Ouvrir le dialog d'assistance
const openAssistanceDialog = () => {
  showAssistanceDialog.value = true
  assistanceForm.value = { sujet: '', message: '' }
}

// Fermer le dialog d'assistance
const closeAssistanceDialog = () => {
  showAssistanceDialog.value = false
  assistanceForm.value = { sujet: '', message: '' }
}

// Envoyer le formulaire d'assistance
const submitAssistance = async () => {
  if (!assistanceForm.value.sujet.trim() || !assistanceForm.value.message.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Champs requis',
      detail: 'Veuillez remplir tous les champs',
      life: 3000
    })
    return
  }

  isSubmitting.value = true
  
  try {
    const response = await apiService.post('/api/assistance', {
      sujet: assistanceForm.value.sujet,
      message: assistanceForm.value.message
    })

    toast.add({
      severity: 'success',
      summary: 'Message envoyé',
      detail: 'Votre demande d\'assistance a été envoyée avec succès',
      life: 4000
    })
    closeAssistanceDialog()
  } catch (error) {
    console.error('Erreur assistance:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Une erreur est survenue lors de l\'envoi de votre message',
      life: 4000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <aside
      :class="[
      'sidebar z-30 transition-all duration-300 ease-in-out flex flex-col',
      !props.isMobile ? 'bg-gradient-to-b from-surface-800 to-surface-950 h-screen fixed top-0 left-0 w-64 border-r border-surface-700' : 'h-auto w-48 mobile-sidebar',
      !props.isMobile && (props.isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full')
    ]"
  >
    <!-- Header avec logo -->
    <div class="sidebar-header p-3 border-b border-surface-700/50">
      <RouterLink to="/" @click="closeSidebarOnMobile" class="block transition-transform hover:scale-105">
        <img src="@/assets/images/logo.png" alt="Logo" class="h-10 mx-auto filter brightness-110"/>
      </RouterLink>
    </div>

    <!-- Navigation par groupes -->
    <nav class="sidebar-nav flex-1 overflow-y-auto">
      <div v-for="group in filteredMenuGroups" :key="group.title" class="menu-group">
        <h3 class="group-title px-4 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider border-b border-surface-800/30">
          {{ group.title }}
        </h3>

        <ul class="group-items py-2">
          <li v-for="item in group.items" :key="item.path" class="menu-item">
            <RouterLink
                :to="item.path"
                @click="closeSidebarOnMobile"
                :class="[
                  'menu-link flex items-center px-4 py-3 mx-2 rounded-lg transition-all duration-200 group relative',
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary border-l-4 border-primary shadow-lg transform scale-[1.02]'
                    : 'text-surface-200 hover:bg-surface-800/50 hover:text-white hover:transform hover:translate-x-1'
                ]"
            >
              <!-- Icône avec animation -->
              <component
                :is="item.icon"
                :class="[
                  'w-5 h-5 mr-3 transition-all duration-200',
                  isActive(item.path) ? 'text-primary scale-110' : 'text-surface-400 group-hover:text-white group-hover:scale-105'
                ]"
              />

              <!-- Label -->
              <span class="font-medium text-sm">{{ item.label }}</span>

              <!-- Indicateur actif -->
              <div
                v-if="isActive(item.path)"
                class="absolute right-2 w-2 h-2 bg-primary rounded-full animate-pulse"
              ></div>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Footer de la sidebar -->
    <div class="sidebar-footer p-4 border-t border-surface-700/50">
      <button
        @click="openAssistanceDialog"
        class="assistance-link flex items-center justify-center w-full px-3 py-2 text-sm text-surface-300 hover:text-white hover:bg-surface-800/50 rounded-lg transition-all duration-200 group"
      >
        <HelpCircle class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
        <span class="font-medium">Assistance</span>
      </button>
    </div>
  </aside>

  <!-- Dialog d'assistance -->
  <Dialog
    v-model:visible="showAssistanceDialog"
    :style="{ width: '90vw', maxWidth: '500px' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    header="Demande d'assistance"
    :modal="true"
    :closable="!isSubmitting"
    :dismissableMask="!isSubmitting"
    class="assistance-dialog"
  >
    <div class="flex flex-col gap-6 pt-4">
      <div class="field">
        <label for="sujet" class="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
          Sujet *
        </label>
        <InputText
          id="sujet"
          v-model="assistanceForm.sujet"
          :disabled="isSubmitting"
          placeholder="Décrivez brièvement votre demande"
          class="w-full"
        />
      </div>

      <div class="field">
        <label for="message" class="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
          Message *
        </label>
        <Textarea
          id="message"
          v-model="assistanceForm.message"
          :disabled="isSubmitting"
          placeholder="Décrivez votre problème ou votre question en détail..."
          rows="5"
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="Annuler"
          icon="pi pi-times"
          :disabled="isSubmitting"
          @click="closeAssistanceDialog"
          outlined
          severity="secondary"
          class="btn-primary"
        />
        <Button
          label="Envoyer"
          icon="pi pi-send"
          :loading="isSubmitting"
          @click="submitAssistance"
          class="p-button-primary"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* Sidebar principale */
.sidebar {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}


/* Header */
.sidebar-header {
  background: linear-gradient(135deg, rgba(var(--primary-500), 0.1) 0%, transparent 100%);
}

/* Navigation */
.sidebar-nav {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* Groupes de menu */
.menu-group:not(:last-child) {
  margin-bottom: 1rem;
}

.group-title {
  position: sticky;
  top: 0;
  background: linear-gradient(to bottom, var(--surface-900), var(--surface-950));
  z-index: 10;
}

/* Items de menu */
.menu-item {
  position: relative;
}

.menu-link {
  position: relative;
  overflow: hidden;
}

.menu-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.menu-link:hover::before {
  left: 100%;
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.menu-item {
  animation: slideIn 0.3s ease-out;
  animation-fill-mode: both;
}

.menu-item:nth-child(1) { animation-delay: 0.1s; }
.menu-item:nth-child(2) { animation-delay: 0.2s; }
.menu-item:nth-child(3) { animation-delay: 0.3s; }
.menu-item:nth-child(4) { animation-delay: 0.4s; }
.menu-item:nth-child(5) { animation-delay: 0.5s; }

/* États de focus et accessibilité */
.menu-link:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: -2px;
}

.menu-link:focus-visible {
  box-shadow: 0 0 0 2px var(--primary-500);
}

/* Mode mobile */
@media (max-width: 767px) {
  .sidebar {
    overflow-y: visible;
    height: auto;
  }

  .menu-link {
    padding: 0.75rem 1rem;
    margin: 0 0.5rem;
  }

  .group-title {
    padding: 0.75rem 1rem;
    font-size: 0.625rem;
  }

  .sidebar-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .assistance-link {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }
}

/* Mode sombre amélioré */
@media (prefers-color-scheme: dark) {
  .sidebar:not(.mobile-sidebar) {
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.3);
  }
}

/* Transitions fluides */
* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Styles pour le bouton d'assistance */
.assistance-link:hover .lucide {
  transform: scale(1.1);
}

/* Styles pour le dialog d'assistance */
:deep(.assistance-dialog .p-dialog-header) {
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  color: white;
  border-radius: 6px 6px 0 0;
}

:deep(.assistance-dialog .p-dialog-header .p-dialog-title) {
  color: white;
  font-weight: 600;
}

:deep(.assistance-dialog .p-dialog-header .p-dialog-header-icon) {
  color: white;
}

:deep(.assistance-dialog .p-dialog-content) {
  padding: 1.5rem;
}

:deep(.assistance-dialog .p-dialog-footer) {
  padding: 1rem 1.5rem;
  background: var(--surface-50);
  border-radius: 0 0 6px 6px;
}
</style>
