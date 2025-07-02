<script setup>
import {ref, computed} from 'vue'
import {useRoute, RouterLink} from 'vue-router'
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import { User } from 'lucide-vue-next';

const route = useRoute()

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
            <h1 class="page-title">
              <User class="title-icon" />
              Mon compte
            </h1>
            <p class="page-subtitle">Gérez vos informations personnelles et préférences</p>
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
</style>
