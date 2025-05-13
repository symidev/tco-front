<script setup>
import Menubar from 'primevue/menubar'
import {useRouter} from 'vue-router'
import {useStore} from 'vuex'
import {computed} from 'vue'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { CircleUser, UserPen, Key, LogOut } from 'lucide-vue-next';

const props = defineProps({items: Array})
const router = useRouter()
const store = useStore()

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

const url = null;
//const url = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";
</script>

<template>
  <Menubar :model="items" class="bg-surface-50 shadow-sm px-4 py-2">
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
