<!-- DataTableCatalogue.vue - Composant réutilisable pour les tableaux de catalogues -->
<script setup>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Menu from 'primevue/menu';
import Button from 'primevue/button';
import { ref, computed } from 'vue';
import { MoreVertical } from 'lucide-vue-next';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  showCreatedColumn: {
    type: Boolean,
    default: true
  },
  showAnalyseColumn: {
    type: Boolean,
    default: false
  },
  rowsPerPage: {
    type: Number,
    default: 3
  },
  countCategoriesGetter: {
    type: Function,
    required: true
  },
  dateFormatter: {
    type: Function,
    required: true
  },
  emptyMessage: {
    type: String,
    default: 'Aucune donnée disponible'
  },
  menuItems: {
    type: Function,
    required: true
  },
  onTitleClick: {
    type: Function,
    default: null
  },
  onCategoriesCountClick: {
    type: Function,
    default: null
  },
  isProgressSection: {
    type: Boolean,
    default: false
  },
  maxCategories: {
    type: Number,
    default: 5
  }
});

const menu = ref();
const selectedRow = ref(null);

const showMenu = (event, data) => {
  selectedRow.value = data;
  menu.value.toggle(event);
};

const menuModelItems = computed(() => {
  return selectedRow.value ? props.menuItems(selectedRow.value) : [];
});

const getCategoriesCountStyle = (catalogue) => {
  const baseStyle = props.countCategoriesGetter(catalogue.countCategories);

  if (props.isProgressSection) {
    return {
      ...baseStyle,
      class: 'text-primary-500 cursor-pointer',
      clickable: true
    };
  } else {
    // Section "Historique" - pas de lien ni de couleur spéciale
    return {
      ...baseStyle,
      class: baseStyle.class,
      clickable: false
    };
  }
};

</script>

<template>
  <DataTable
      :value="data"
      paginator
      :alwaysShowPaginator="false"
      paginatorTemplate="PrevPageLink CurrentPageReport NextPageLink"
      currentPageReportTemplate="{currentPage} de {totalPages}"
      :rows="rowsPerPage"
      sortField="created"
      :sortOrder="-1"
      size="small"
      responsive-layout="scroll"
      :scrollable="true"
      scrollHeight="flex"
  >
    <Column
        sortable
        field="title"
        header="Titre"
        style="min-width: 10rem; width: 100%"
    >
      <template #body="slotProps">
        <span
          v-if="onTitleClick"
          class="cursor-pointer text-primary-500 transition-colors"
          @click="onTitleClick(slotProps.data)"
        >
          {{ slotProps.data.title }}
        </span>
        <span v-else>
          {{ slotProps.data.title }}
        </span>
      </template>
    </Column>

    <Column
        field="description"
        header="Description"
        style="width: 350px; min-width: 350px; max-width: 350px;"
        class="hidden lg:table-cell"
    >
      <template #body="slotProps">
        <div class="truncate" :title="slotProps.data.description">{{ slotProps.data.description }}</div>
      </template>
    </Column>

    <Column
        field="countCategories"
        header="Nb catégories"
        style="width: 130px; min-width: 130px; max-width: 130px"
        class="hidden sm:table-cell"
    >
      <template #body="slotProps">
        <div
          v-if="onCategoriesCountClick && getCategoriesCountStyle(slotProps.data).clickable"
          :class="[getCategoriesCountStyle(slotProps.data).class, 'transition-colors']"
          @click="onCategoriesCountClick(slotProps.data)"
        >
          {{ getCategoriesCountStyle(slotProps.data).text }}
        </div>
        <div v-else :class="getCategoriesCountStyle(slotProps.data).class">
          {{ getCategoriesCountStyle(slotProps.data).text }}
        </div>
      </template>
    </Column>

    <Column
        v-if="showCreatedColumn"
        sortable
        field="created"
        header="Date de création"
        style="width: 180px; min-width: 180px; max-width: 180px"
        class="hidden sm:table-cell"
    >
      <template #body="slotProps">
        {{ dateFormatter(slotProps.data.created) }}
      </template>
    </Column>

    <Column
        v-if="showAnalyseColumn"
        sortable
        field="date_analyse"
        header="Date d'analyse"
        style="width: 180px; min-width: 180px; max-width: 180px"
        class="hidden sm:table-cell"
    >
      <template #body="slotProps">
        {{ dateFormatter(slotProps.data.date_analyse) }}
      </template>
    </Column>

    <Column
        field="actions"
        header="Actions"
        style="width: 70px; min-width: 70px; max-width: 70px"
        alignFrozen="right"
    >
      <template #body="slotProps">
        <Button
            severity="secondary"
            text
            rounded
            @click="showMenu($event, slotProps.data)"
            class="p-2"
        >
          <MoreVertical class="w-5 h-5" />
        </Button>
      </template>
    </Column>

    <template #empty>
      <div class="p-4 text-center text-gray-500 font-medium">
        {{ emptyMessage }}
      </div>
    </template>
  </DataTable>

  <Menu ref="menu" :model="menuModelItems" :popup="true">
    <template #item="{ item }">
      <a class="p-menuitem-link flex items-center cursor-pointer text-sm">
        <component :is="item.icon" v-if="item.icon" class="w-4 h-4 mr-2 text-primary-500" />
        <span class="p-menuitem-text font-medium">{{ item.label }}</span>
      </a>
    </template>
  </Menu>
</template>

<style scoped>
/* Assure que les colonnes cachées fonctionnent correctement */
@media (max-width: 640px) {
  :deep(.hidden) {
    display: none !important;
  }
}

/* Hover léger sur les lignes des tableaux */
:deep(.p-datatable-tbody > tr) {
  transition: background-color 0.2s ease !important;
}

:deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--p-surface-700);
}

/* Hover spécifique pour les lignes striées */
:deep(.p-datatable-striped .p-datatable-tbody > tr:nth-child(even):hover) {
  background-color: rgba(59, 130, 246, 0.12) !important;
}

/* S'assurer que les styles PrimeVue par défaut sont surchargés */
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: var(--p-surface-700);
}

:deep(.p-datatable.p-datatable-striped .p-datatable-tbody > tr:nth-child(even):hover) {
  background-color: var(--p-surface-700);
}

/* Amélioration du responsive pour la colonne titre */
@media (max-width: 640px) {
  :deep(.p-datatable th),
  :deep(.p-datatable td) {
    padding: 0.5rem;
  }
}

/* Style pour les items du menu */
:deep(.p-menuitem-link) {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 400;
  font-size: 0.875rem;
  letter-spacing: -0.005em;
}

:deep(.p-menuitem-link:hover) {
  background-color: var(--p-surface-700);
}
</style>