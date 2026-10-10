/**
 * Configuración central de la aplicación.
 * Todo parámetro de UI, umbral o constantes de entorno vive acá — nunca en componentes.
 */
import type { DataMode } from '@/types/states';

const env = import.meta.env;

const firebaseEnv = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** Firebase queda configurado solo si las variables críticas están presentes. */
export const isFirebaseConfigured = Boolean(
  firebaseEnv.apiKey && firebaseEnv.projectId && firebaseEnv.appId,
);

export const firebaseConfig = firebaseEnv;

function resolveDataMode(): DataMode {
  const requested = (env.VITE_DATA_MODE as string | undefined)?.toLowerCase();
  if (requested === 'firebase') {
    if (!isFirebaseConfigured) {
      // Nunca fingir una integración: sin credenciales se cae a demo y se declara.
      console.warn('[yvy] VITE_DATA_MODE=firebase pero faltan variables VITE_FIREBASE_*. Se usa modo demo.');
      return 'demo';
    }
    return 'firebase';
  }
  return 'demo';
}

export const appConfig = {
  appName: 'Yvy Resiliente',
  dataMode: resolveDataMode(),
  isDemo: resolveDataMode() === 'demo',
  region: {
    label: 'Corrientes y Chaco',
    centerLat: -28.2,
    centerLng: -58.4,
  },
  /** Límites de la proyección del visor cartográfico. */
  map: {
    bounds: { minLat: -31.5, maxLat: -23.8, minLng: -61.5, maxLng: -55.0 },
    viewBox: { w: 900, h: 600 },
  },
  /** Política de adjuntos de reportes (aplicada también en storage.rules). */
  photos: {
    maxBytes: 5 * 1024 * 1024,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  },
  /** Umbrales de antigüedad por tipo de dato (ms) para marcar `stale`. */
  staleAfterMs: {
    station: 6 * 60 * 60 * 1000,   // estaciones hidrométricas: 6 h
    sensor: 30 * 60 * 1000,        // telemetría: 30 min
    alert: 12 * 60 * 60 * 1000,    // alertas publicadas: 12 h
  },
  pagination: { defaultPageSize: 50 },
} as const;

export type AppConfig = typeof appConfig;
