/**
 * Estados de consulta estandarizados para toda la interfaz.
 * Ninguna vista debe inventar datos cuando el estado no es `ok`.
 */

export type DataMode = 'demo' | 'firebase';

export interface QueryMeta {
  /** Origen del dato: adaptador activo. */
  mode: DataMode;
  /** Antigüedad del dato más reciente (ms) cuando es medible. */
  ageMs?: number;
  /** El dato supera el umbral de vigencia esperado. */
  stale?: boolean;
  /** La fuente respondió parcialmente. */
  partial?: boolean;
}

export type QueryState<T> =
  | { status: 'loading'; meta?: QueryMeta }
  | { status: 'ok'; data: T; meta?: QueryMeta }
  | { status: 'empty'; meta?: QueryMeta }
  | { status: 'error'; error: string; meta?: QueryMeta };

export function loading<T>(meta?: QueryMeta): QueryState<T> {
  return { status: 'loading', meta };
}
export function ok<T>(data: T, meta?: QueryMeta): QueryState<T> {
  return { status: 'ok', data, meta };
}
export function empty<T>(meta?: QueryMeta): QueryState<T> {
  return { status: 'empty', meta };
}
export function error<T>(error: string, meta?: QueryMeta): QueryState<T> {
  return { status: 'error', error, meta };
}

/** Convierte cualquier error en mensaje seguro para UI (sin secretos ni stacktraces). */
export function toUserMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes('permission-denied')) return 'No tenés permisos para esta operación.';
    if (err.message.includes('unauthenticated') || err.message.includes('requires-recent-login')) return 'Necesitás iniciar sesión.';
    return err.message;
  }
  return 'Ocurrió un error inesperado. Reintentá en unos momentos.';
}
