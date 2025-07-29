<script setup>
import {ref, computed} from 'vue'
import {useRoute, RouterLink} from 'vue-router'
import {useStore} from 'vuex'
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import { User } from 'lucide-vue-next';
import SubscriptionInfo from '@/components/user/SubscriptionInfo.vue';

const route = useRoute()
const store = useStore()

// Récupérer les données utilisateur depuis le store
const userData = computed(() => store.state.user.user)

const items = ref([
  {
    label: 'Édition du profil',
    icon: 'pi pi-user',
    route: '/account',
  },
  {
    label: 'Mot de passe',
    icon: 'pi pi-lock',
    route: '/account/password',
  }
])

// Déterminer l'index de l'item actif
const activeIndex = computed(() => {
  const index = items.value.findIndex(item => item.route === route.path)
  return index !== -1 ? items.value[index].route : '/account'
})
</script>

<template>
  <div class="page-container">
    <div class="page-content">
      <!-- Header avec titre -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <div class="title-container">
              <div class="flex flex-col gap-2">
                <h1 class="page-title">
                  <User class="title-icon" />
                  Mon compte
                </h1>
                <a 
                  href="/src/assets/doc/cgu.pdf" 
                  download="Conditions_Generales_Utilisation.pdf"
                  class="text-sm text-white hover:text-gray-200 hover:bg-gray-700 hover:bg-opacity-30 px-2 py-1 rounded transition-all duration-200 flex items-center gap-1 w-fit mt-6"
                >
                  <i class="pi pi-download text-xs mr-1"></i>
                  Télécharger les CGU
                </a>
              </div>
              <div class="subscription-container">
                <SubscriptionInfo v-if="userData" :userData="userData" :compact="true" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation tabs -->
      <div class="content-grid animate-slide-in-up">
        <div class="section-card">
          <div class="section-content">
            <Tabs :value="activeIndex" class="py-6">
              <TabList>
                <Tab v-for="tab in items" :key="tab.label" :value="tab.route">
                  <RouterLink v-if="tab.route" v-slot="{ href, navigate }" :to="tab.route" custom>
                    <a :href="href" @click="navigate" class="flex items-center gap-2 text-inherit">
                      <i :class="tab.icon"/>
                      <span>{{ tab.label }}</span>
                    </a>
                  </RouterLink>
                </Tab>
              </TabList>
            </Tabs>
            <RouterView/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles pour les icônes de navigation */
:deep(.p-tablist-tab-list) {
  margin-bottom: 1.5rem;
}

:deep(.p-tab) {
  padding: 0.75rem 1.5rem;
}

:deep(.p-tab a) {
  text-decoration: none;
  color: inherit;
  font-weight: 500;
}

:deep(.p-tab[aria-selected="true"]) {
  background-color: var(--p-primary-color);
  color: white;
}

:deep(.p-tab[aria-selected="true"] a) {
  color: white;
}

/* Styles responsives pour mobile */
@media (max-width: 767px) {
  :deep(.p-tablist-tab-list) {
    margin-bottom: 1rem;
  }
  
  :deep(.p-tab) {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
  
  :deep(.p-tab a) {
    gap: 0.375rem;
    font-size: 0.875rem;
  }
  
  :deep(.p-tab i) {
    font-size: 0.875rem;
  }
}

/* Styles pour très petits écrans */
@media (max-width: 480px) {
  :deep(.p-tab) {
    padding: 0.375rem 0.5rem;
    font-size: 0.8125rem;
  }
  
  :deep(.p-tab a) {
    gap: 0.25rem;
    font-size: 0.8125rem;
  }
  
  :deep(.p-tab i) {
    font-size: 0.8125rem;
  }
}

/* Styles pour le layout du header */
.title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 2rem;
}

.subscription-container {
  flex-shrink: 0;
}

/* Responsive pour le header */
@media (max-width: 768px) {
  .title-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .subscription-container {
    width: 100%;
  }
}
</style>
