<script setup>
import { computed } from 'vue'
import { Crown, Calendar } from 'lucide-vue-next'
import Card from 'primevue/card'
import { useStore } from 'vuex'

const store = useStore()

// Props
const props = defineProps({
  userData: {
    type: Object,
    required: true
  },
  compact: {
    type: Boolean,
    default: false
  }
})

// Récupérer les rôles de l'utilisateur depuis le store
const userRoles = computed(() => {
  return store.state.auth?.tokenInfo?.drupal?.roles || []
})

// Déterminer le type d'abonnement basé sur les rôles
const subscriptionType = computed(() => {
  if (userRoles.value.includes('catalogue')) {
    return 'Abonnement Catalogue'
  } else if (userRoles.value.includes('comparo')) {
    return 'Abonnement Comparo'
  } else {
    return 'Pas d\'abonnement actif'
  }
})

// Formater la date au format français complet
const formatSubscriptionDate = (dateString) => {
  if (!dateString) return null
  
  try {
    // Si c'est déjà un timestamp, le convertir
    let date
    if (typeof dateString === 'number') {
      date = new Date(dateString * 1000) // Conversion timestamp en millisecondes
    } else {
      date = new Date(dateString)
    }
    
    if (isNaN(date.getTime())) return null
    
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error)
    return null
  }
}

// Date de souscription formatée
const formattedSubscriptionDate = computed(() => {
  return formatSubscriptionDate(props.userData.field_user_date_abo)
})

// Couleur du badge selon le type d'abonnement
const subscriptionBadgeClass = computed(() => {
  if (userRoles.value.includes('catalogue')) {
    return 'subscription-catalogue'
  } else if (userRoles.value.includes('comparo')) {
    return 'subscription-comparo'
  } else {
    return 'subscription-inactive'
  }
})
</script>

<template>
  <!-- Version compacte pour header -->
  <div v-if="compact" class="subscription-header">
    <!-- Type d'abonnement -->
    <div class="subscription-badge-container">
      <span 
        :class="subscriptionBadgeClass"
        class="subscription-badge"
      >
        {{ subscriptionType }}
      </span>
    </div>

    <!-- Date de souscription (seulement si elle existe) -->
    <div v-if="formattedSubscriptionDate" class="subscription-date">
      <span class="subscription-date-text">Souscrit le {{ formattedSubscriptionDate }}</span>
    </div>
  </div>

  <!-- Version complète pour section -->
  <Card v-else class="shadow-sm">
    <template #title>
      <div class="flex items-center gap-2 text-primary">
        <Crown class="w-5 h-5"/>
        <h2>Informations d'abonnement</h2>
      </div>
    </template>

    <template #content>
      <div class="space-y-4">
        <!-- Type d'abonnement -->
        <div class="flex items-center justify-between p-3 rounded-lg border bg-surface-50">
          <div class="flex items-center gap-3">
            <Crown class="w-4 h-4 text-primary"/>
            <span class="font-medium text-surface-900">Type d'abonnement</span>
          </div>
          <span 
            :class="subscriptionBadgeClass"
            class="px-3 py-1 rounded-full text-sm font-medium border"
          >
            {{ subscriptionType }}
          </span>
        </div>

        <!-- Date de souscription (seulement si elle existe) -->
        <div 
          v-if="formattedSubscriptionDate" 
          class="flex items-center justify-between p-3 rounded-lg border bg-surface-50"
        >
          <div class="flex items-center gap-3">
            <Calendar class="w-4 h-4 text-primary"/>
            <span class="font-medium text-surface-900">Date de souscription</span>
          </div>
          <span class="text-sm text-surface-700 italic">
            {{ formattedSubscriptionDate }}
          </span>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
/* Version compacte pour header */
.subscription-header {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.subscription-badge-container {
  display: flex;
  align-items: center;
}

.subscription-badge {
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subscription-catalogue {
  background: var(--p-surface-900);
  color: var(--p-primary-color);
  border-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.subscription-comparo {
  background: var(--p-surface-900);
  color: var(--p-primary-color);
  border-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.subscription-inactive {
  background: var(--p-surface-900);
  color: var(--p-primary-color);
  border-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.subscription-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 1rem;
}


.subscription-date-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* Animations et effets */
.subscription-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.subscription-catalogue:hover {
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.subscription-comparo:hover {
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
}

.subscription-inactive:hover {
  box-shadow: 0 4px 16px rgba(156, 163, 175, 0.3);
}

/* Version complète pour section */
:deep(.p-card) {
  box-shadow: none !important;
  border: none !important;
}

:deep(.p-card-content) {
  padding: 0 !important;
}

/* Responsive */
@media (max-width: 768px) {
  .subscription-header {
    gap: 0.5rem;
  }
  
  .subscription-badge {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
  
  
  .subscription-date-text {
    font-size: 0.8125rem;
  }
}
</style>