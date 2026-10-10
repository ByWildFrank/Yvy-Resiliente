<script setup lang="ts">
export type BadgeTone = 'critical' | 'warning' | 'info' | 'neutral' | 'success';

const props = withDefaults(defineProps<{
  label: string;
  tone?: BadgeTone;
  uppercase?: boolean;
}>(), {
  tone: 'neutral',
  uppercase: true,
});

const classes: Record<BadgeTone, string> = {
  critical: 'bg-[#a40217] text-[#ffdad6]',
  warning: 'bg-[#f48c24]/20 text-[#ffb77d] border border-[#f48c24]/30',
  info: 'bg-[#06b6d4]/20 text-[#4cd7f6] border border-[#06b6d4]/30',
  neutral: 'bg-[#232a37] text-[#bcc9cd] border border-[#3d494c]/40',
  success: 'bg-[#06b6d4]/20 text-[#4cd7f6] border border-[#06b6d4]/40',
};

const toneFor = (t: string): BadgeTone =>
  (['critical', 'warning', 'info', 'neutral', 'success'] as BadgeTone[]).includes(t as BadgeTone)
    ? (t as BadgeTone)
    : 'neutral';
</script>

<template>
  <span
    :class="[
      'inline-flex items-center font-mono text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide whitespace-nowrap',
      classes[toneFor(tone)],
      uppercase ? 'uppercase' : '',
    ]"
  >
    {{ label }}
  </span>
</template>
