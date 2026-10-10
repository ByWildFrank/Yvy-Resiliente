<script setup lang="ts">
withDefaults(defineProps<{
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  hintTone?: 'default' | 'warn' | 'critical' | 'info';
  badge?: string;
  badgeTone?: 'critical' | 'warning' | 'info' | 'neutral';
  clickable?: boolean;
  notAvailable?: boolean;
}>(), {
  clickable: false,
  notAvailable: false,
});

defineEmits<{ select: [] }>();
</script>

<template>
  <component
    :is="clickable ? 'button' : 'div'"
    :type="clickable ? 'button' : undefined"
    :class="[
      'bg-[#18202c] border border-[#3d494c]/30 rounded-lg p-3 shadow-sm flex flex-col justify-between gap-2 text-left',
      clickable ? 'cursor-pointer hover:bg-[#232a37] hover:border-[#3d494c] transition-all' : '',
    ]"
    @click="clickable && $emit('select')"
  >
    <div class="flex items-start justify-between gap-2">
      <span class="font-mono text-[11px] text-[#869397] uppercase tracking-wider">{{ label }}</span>
      <span
        v-if="badge"
        :class="[
          'font-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap',
          badgeTone === 'critical' ? 'bg-[#a40217] text-[#ffdad6]' :
          badgeTone === 'warning' ? 'bg-[#f48c24]/20 text-[#ffb77d]' :
          badgeTone === 'info' ? 'bg-[#06b6d4]/20 text-[#4cd7f6]' :
          'bg-[#232a37] text-[#bcc9cd]',
        ]"
      >
        {{ badge }}
      </span>
    </div>

    <div v-if="notAvailable" class="text-base font-mono font-bold text-[#869397]">
      No disponible
    </div>
    <div v-else class="flex items-baseline justify-between gap-2">
      <span class="text-2xl font-bold font-mono text-[#dbe3f4] leading-none">
        {{ value }}<span v-if="unit" class="text-sm font-normal text-[#869397] ml-1">{{ unit }}</span>
      </span>
      <span
        v-if="hint"
        :class="[
          'font-mono text-xs font-semibold whitespace-nowrap',
          hintTone === 'warn' ? 'text-[#ffb77d]' :
          hintTone === 'critical' ? 'text-[#ffb3ad]' :
          hintTone === 'info' ? 'text-[#4cd7f6]' :
          'text-[#869397]',
        ]"
      >
        {{ hint }}
      </span>
    </div>

    <div v-if="!notAvailable" class="h-0"><slot /></div>
  </component>
</template>
