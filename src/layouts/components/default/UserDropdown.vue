<!-- UserDropdown.vue -->
<script setup>
import { UserPen, Settings, LogOut, CircleUser } from 'lucide-vue-next'
</script>

<template>
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar flex items-center justify-center">
      <div class="w-10 rounded-full flex items-center justify-center">
        <CircleUser class="w-8 h-8"/>
      </div>
    </div>
    <ul
        tabindex="0"
        class="menu menu-sm dropdown-content bg-base-200 rounded-box z-40 gap-2 w-44 p-2 shadow">
      <li>
        <a>
          <UserPen class="inline-block mr-2"/>
          Mon compte
        </a>
      </li>
      <li>
        <a>
          <Settings class="inline-block mr-2"/>
          Configuration
        </a>
      </li>
      <li>
        <RouterLink to="/logout">
          <LogOut class="inline-block mr-2"/>
          Déconnexion
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
