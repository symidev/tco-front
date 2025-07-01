<script setup>
import Menubar from 'primevue/menubar'
import {useRouter} from 'vue-router'
import {useStore} from 'vuex'
import {computed} from 'vue'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { CircleUser, UserPen, Key, LogOut, Menu as MenuIcon } from 'lucide-vue-next';

const props = defineProps({
  items: Array,
  isMobile: Boolean
})
const emit = defineEmits(['toggleMobileSidebar'])
const router = useRouter()
const store = useStore()

// Fonction pour vérifier si l'utilisateur a les permissions nécessaires
const hasPermission = (permissions) => {
  // Si aucune permission n'est requise
  if (!permissions || permissions.length === 0) {
    return true
  }

  // Récupérer les rôles de l'utilisateur
  const userRoles = store.state.auth?.tokenInfo?.roles || []

  // Vérifier si l'utilisateur a au moins un des rôles requis
  return permissions.some(permission => userRoles.includes(permission))
}

// Filtrer les éléments du menu en fonction des permissions
const filteredItems = computed(() => {
  if (!props.items) return []

  return props.items.filter(item => {
    // Si l'élément n'a pas de propriété permissions, il est toujours visible
    if (!item.permissions) return true

    // Sinon, vérifier les permissions
    return hasPermission(item.permissions)
  })
})

const userActions = [
  {
    label: 'Mon profil',
    icon: UserPen,
    command: () => router.push('/account')
  },
  {
    label: 'Mot de passe',
    icon: Key,
    command: () => router.push('/account/password')
  },
  {
    label: 'Déconnexion',
    icon: LogOut,
    command: () => {
      store.dispatch('auth/logout')
      router.push('/login')
    }
  }
]

// Transition classes
const transitionClasses = {
  enterActive: 'transition ease-out duration-100',
  enterFrom: 'transform opacity-0 scale-95',
  enterTo: 'transform opacity-100 scale-100',
  leaveActive: 'transition ease-in duration-75',
  leaveFrom: 'transform opacity-100 scale-100',
  leaveTo: 'transform opacity-0 scale-95'
}

const url = computed(() => {
  if (store.state.auth?.tokenInfo?.drupal && store.state.auth?.tokenInfo?.drupal?.logo) {
    return store.state.auth.tokenInfo.drupal.logo ?? null;
  }
  return null;
})
</script>

<template>
  <Menubar :model="filteredItems" class="bg-surface-50 shadow-sm px-4 py-2">
    <template #start v-if="isMobile">
      <div class="flex items-center gap-3">
        <button
            @click="emit('toggleMobileSidebar')"
            class="p-2 hover:bg-surface-100 rounded-lg transition-colors"
        >
          <MenuIcon class="w-5 h-5 text-surface-600" />
        </button>
        <RouterLink to="/" class="flex items-center">
          <img src="@/assets/images/logo.png" alt="Logo" class="h-8"/>
        </RouterLink>
      </div>
    </template>
    <template #end>
      <Menu as="div" class="relative ml-3 py-1">
        <div>
          <MenuButton
              class="relative flex rounded-full bg-surface-100 hover:bg-surface-200 p-1 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <span class="sr-only">Ouvrir le menu utilisateur</span>
            <img
                v-if="url"
                class="size-8 rounded-full object-cover"
                :src="url"
                alt="Logo client"
            />
            <CircleUser v-else class="w-8 h-8 text-surface-900" />
          </MenuButton>
        </div>

        <transition
            :enter-active-class="transitionClasses.enterActive"
            :enter-from-class="transitionClasses.enterFrom"
            :enter-to-class="transitionClasses.enterTo"
            :leave-active-class="transitionClasses.leaveActive"
            :leave-from-class="transitionClasses.leaveFrom"
            :leave-to-class="transitionClasses.leaveTo"
        >
          <MenuItems
              class="absolute right-0 z-10 mt-2 w-48
              origin-top-right rounded-sm py-2
              shadow-lg ring-1 ring-surface-300 ring-opacity-5
              focus:outline-none bg-surface-800">
            <!-- Utiliser les actions du props -->
            <MenuItem v-for="(action, index) in userActions" :key="index" v-slot="{ active }">
              <a
                  href="#"
                  :class="[
                    active ? 'text-primary-500' : 'text-primary-inverseColor',
                    'group flex items-center px-4 py-2 text-sm hover:text-primary-500 transition-colors'
                  ]"
                  @click.prevent="action.command"
              >
                <component :is="action.icon" class="h-5 w-5 text-primary-500 mr-2"></component>
                {{ action.label }}
              </a>
            </MenuItem>
          </MenuItems>
        </transition>
      </Menu>
    </template>
  </Menubar>
</template>
