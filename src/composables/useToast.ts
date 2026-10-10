/**
 * Sistema de notificaciones (toasts) global.
 * Los mensajes de éxito SOLO se emiten tras confirmación real del servicio/repositorio.
 */
import { reactive } from 'vue';

export interface Toast {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

const toasts = reactive<Toast[]>([]);
let nextId = 1;

export function pushToast(type: Toast['type'], title: string, message = ''): void {
  const toast: Toast = { id: nextId++, type, title, message };
  toasts.push(toast);
  setTimeout(() => dismissToast(toast.id), 5000);
}

export function dismissToast(id: number): void {
  const idx = toasts.findIndex((t) => t.id === id);
  if (idx >= 0) toasts.splice(idx, 1);
}

export function useToasts() {
  return { toasts, pushToast, dismissToast };
}
