<script setup lang="ts">
defineProps<{
  icon?: string;
  title: string;
  subtitle?: string;
  tone?: 'info' | 'critical' | 'warning';
}>();
</script>

<template>
  <div class="bg-[#141c28] border border-[#3d494c]/40 rounded-lg p-3 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <div
        v-if="icon"
        :class="[
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          tone === 'critical' ? 'bg-[#a40217]/25 border border-[#a40217]/40 text-[#ffb3ad]' :
          tone === 'warning' ? 'bg-[#f48c24]/15 border border-[#f48c24]/40 text-[#ffb77d]' :
          'bg-[#06b6d4]/20 border border-[#06b6d4]/40 text-[#4cd7f6]',
        ]"
      >
        <span class="material-symbols-outlined text-2xl">{{ icon }}</span>
      </div>
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <h1 class="text-base font-bold text-[#dbe3f4] uppercase tracking-tight">{{ title }}</h1>
          <slot name="badge" />
        </div>
        <p v-if="subtitle" class="text-xs text-[#bcc9cd] mt-0.5 max-w-3xl">{{ subtitle }}</p>
      </div>
    </div>
    <div class="flex items-center gap-2 w-full md:w-auto">
      <slot name="actions" />
    </div>
  </div>
</template>
