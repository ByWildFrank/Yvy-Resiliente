/**
 * Fábrica de repositorios: selecciona el adaptador activo según la configuración.
 * El resto de la aplicación jamás importa un adaptador concreto.
 *
 * Nota: ambos adaptadores se incluyen en el bundle (el SDK Firebase ya forma parte
 * del proyecto); solo se INSTANCIA el activo. En modo demo, `src/firebase.ts`
 * no inicializa ningún servicio.
 */
import { appConfig } from '@/config/appConfig';
import type { Backend } from '@/repositories/contracts';
import { createDemoBackend } from '@/repositories/demo/demoBackend';
import { createFirebaseBackend } from '@/repositories/firebase/firebaseBackend';

let backendInstance: Backend | null = null;

export function getBackend(): Backend {
  if (!backendInstance) {
    backendInstance = appConfig.dataMode === 'firebase'
      ? createFirebaseBackend()
      : createDemoBackend();
  }
  return backendInstance;
}
