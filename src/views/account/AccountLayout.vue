<script setup>
import {ref, computed} from 'vue'
import {useRoute, RouterLink} from 'vue-router'
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';

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
  <div class="gap-3 w-full flex justify-center">
    <div class="w-full max-w-[1200px] flex flex-1 flex-col my-8">
      <h1 class="text-xl sm:text-2xl font-bold pb-6">Mon compte</h1>
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
</template>
