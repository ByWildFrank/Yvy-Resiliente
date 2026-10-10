<script setup lang="ts">
import { useToasts } from '@/composables/useToast';

const { toasts, dismissToast } = useToasts();

const toneClasses: Record<string, string> = {
  success: 'border-[#06b6d4] text-[#acedff]',
  info: 'border-[#06b6d4] text-[#acedff]',
  warning: 'border-[#f48c24] text-[#ffdcc3]',
  error: 'border-[#a40217] text-[#ffdad6]',
};
const icons: Record<string, string> = {
  success: 'check_circle',
  info: 'info',
  warning: 'notifications',
  error: 'error',
};
</script>

<template>
  <transition-group
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
    tag="div"
    class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-[calc(100vw-2rem)]"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['bg-[#141c28] border rounded-lg p-3 shadow-2xl flex items-start gap-3', toneClasses[toast.type]]"
    >
      <span class="material-symbols-outlined text-[20px] shrink-0 mt-0.5">{{ icons[toast.type] }}</span>
      <div class="min-w-0 flex-1">
        <div class="font-bold text-xs uppercase tracking-wider font-mono">{{ toast.title }}</div>
        <div v-if="toast.message" class="text-xs text-[#bcc9cd] mt-0.5 leading-relaxed">{{ toast.message }}</div>
      </div>
      <button
        type="button"
        class="text-[#869397] hover:text-[#dbe3f4]"
        @click="dismissToast(toast.id)"
        aria-label="Cerrar notificación"
      >
        <span class="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  </transition-group>
</template>
