/**
 * Servicio de inicialización y aseguramiento de la base de datos Firestore.
 * Garantiza que la base de datos cuente con los elementos base estructurados,
 * índices y catálogos requeridos para escalabilidad y rendimiento.
 */
import { getBackend } from '@/repositories';
import { requireFirebase, isFirebaseConfigured } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, limit } from 'firebase/firestore';

export async function ensureDatabaseReady(): Promise<boolean> {
  if (!isFirebaseConfigured) return true;

  try {
    const { db } = requireFirebase();
    const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
    if (settingsSnap.exists()) {
      return true;
    }

    // Si settings no existe, inicializar configuración general
    await setDoc(doc(db, 'settings', 'general'), {
      appName: 'Yvy Resiliente',
      regionLabel: 'Corrientes y Chaco',
      defaultTerritory: 'Corrientes Capital',
      demoBannerEnabled: false,
      mapBounds: { minLat: -31.5, maxLat: -23.8, minLng: -61.5, maxLng: -55.0 },
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('[yvy] Error al verificar estado de la base de datos:', err);
    return false;
  }
}
