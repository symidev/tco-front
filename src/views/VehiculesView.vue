<script setup lang="ts">
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Combobox, ComboboxAnchor, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxList, ComboboxTrigger } from '@/components/ui/combobox'
import { Check, ChevronsUpDown, Search } from 'lucide-vue-next'
import { ref } from 'vue'

const frameworks = [
  { value: 'next.js', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
]

const value = ref<typeof frameworks[0]>()
</script>

<template>
  <Combobox v-model="value" by="label">
    <ComboboxAnchor as-child>
      <ComboboxTrigger as-child>
        <Button
            variant="outline"
            class="w-md justify-between
                 border border-[var(--color-base-content)]
                 bg-[var(--color-base-100)]
                 text-[var(--color-base-content)]"
        >
          {{ value?.label ?? 'Select framework' }}
          <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxList
        class="mt-1 w-full max-w-sm rounded-md border
             bg-[var(--color-base-100)]
             text-[var(--color-base-content)]
             shadow-lg"
    >
      <div class="relative w-full max-w-sm items-center">
        <ComboboxInput
            class="pl-9 h-10 border-0 border-b
                 border-[var(--color-base-content)]
                 bg-transparent
                 text-[var(--color-base-content)]
                 focus-visible:ring-0"
            placeholder="Select framework..."
        />
        <span class="absolute inset-y-0 start-0 flex items-center px-3">
          <Search class="size-4 text-[var(--color-base-content)]" />
        </span>
      </div>

      <ComboboxEmpty
          class="px-4 py-2 text-sm text-[var(--color-base-content)]"
      >
        No framework found.
      </ComboboxEmpty>

      <ComboboxGroup class="p-2">
        <ComboboxItem
            v-for="framework in frameworks"
            :key="framework.value"
            :value="framework"
            class="px-2 py-1 text-sm rounded-md cursor-pointer
                 text-[var(--color-base-content)]
                 data-[state=active]:bg-[var(--color-base-200)]
                 data-[state=active]:text-[var(--color-base-content)]"
        >
          {{ framework.label }}
          <ComboboxItemIndicator>
            <Check class="ml-auto h-4 w-4 text-[var(--color-base-content)]" />
          </ComboboxItemIndicator>
        </ComboboxItem>
      </ComboboxGroup>
    </ComboboxList>
  </Combobox>
</template>
