<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  wide?: boolean;
}>();

const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <div
        :class="[
          'bg-[#141c28] border border-[#3d494c]/50 rounded-xl shadow-2xl flex flex-col max-h-[90vh]',
          wide ? 'w-full max-w-3xl' : 'w-full max-w-md',
        ]"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#3d494c]/40 shrink-0">
          <h3 class="text-sm font-bold text-[#dbe3f4] uppercase tracking-tight">{{ title }}</h3>
          <button
            type="button"
            class="text-[#869397] hover:text-[#dbe3f4] p-1 rounded hover:bg-[#232a37]"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div class="overflow-y-auto p-4">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
