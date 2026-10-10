/**
 * Composable de consulta estandarizada: TODA lectura de datos de las vistas
 * pasa por acá. Garantiza estados explícitos (carga/ok/vacío/error) y
 * recarga reactiva cuando cambian dependencias.
 */
import { ref, watch, type Ref } from 'vue';
import { toUserMessage, type QueryMeta, type QueryState } from '@/types/states';

export interface UseAsyncDataOptions<T> {
  /** Determina si un resultado exitoso debe mostrarse como "sin resultados". */
  isEmpty?: (data: T) => boolean;
  /** Dependencias reactivas que disparan recarga. */
  deps?: Array<Ref<unknown> | (() => unknown)>;
  /** Ejecutar inmediatamente (default true). */
  immediate?: boolean;
  meta?: QueryMeta;
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions<T> = {},
) {
  const state = ref<QueryState<T>>({ status: options.immediate === false ? 'loading' : 'loading', meta: options.meta });
  let seq = 0;

  const reload = async (): Promise<void> => {
    const current = ++seq;
    state.value = { status: 'loading', meta: options.meta };
    try {
      const data = await fetcher();
      if (current !== seq) return; // una recarga más nueva la reemplaza
      state.value = options.isEmpty?.(data)
        ? { status: 'empty', meta: options.meta }
        : { status: 'ok', data, meta: options.meta };
    } catch (err) {
      if (current !== seq) return;
      state.value = { status: 'error', error: toUserMessage(err), meta: options.meta };
    }
  };

  if (options.immediate !== false) {
    void reload();
  }
  if (options.deps?.length) {
    watch(options.deps, () => { void reload(); });
  }

  return { state, reload };
}
