<!-- ComparoDataTable.vue - Version modifiée avec template slot -->
<script setup>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Menu from 'primevue/menu';
import Button from 'primevue/button';
import { ref,computed} from 'vue';
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
  countVehiculeGetter: {
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
    ></Column>

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
        field="countVehicule"
        header="Nb véhicules"
        style="width: 130px; min-width: 130px; max-width: 130px"
        class="hidden sm:table-cell"
    >
      <template #body="slotProps">
        <div :class="countVehiculeGetter(slotProps.data.countVehicule).class">
          {{ countVehiculeGetter(slotProps.data.countVehicule).text }}
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
      <div class="p-4 text-center text-gray-500">
        {{ emptyMessage }}
      </div>
    </template>
  </DataTable>

  <Menu ref="menu" :model="menuModelItems" :popup="true">
    <template #item="{ item }">
      <a class="p-menuitem-link flex items-center cursor-pointer text-sm">
        <component :is="item.icon" v-if="item.icon" class="w-4 h-4 mr-2 text-primary-500" />
        <span class="p-menuitem-text">{{ item.label }}</span>
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
}

:deep(.p-menuitem-link:hover) {
  background-color: var(--p-surface-700);
}
</style>
