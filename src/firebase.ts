/**
 * Inicialización de Firebase — condicional.
 * Si no hay credenciales (VITE_FIREBASE_*), la app funciona en modo demo
 * y este módulo no inicializa ningún servicio.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig, isFirebaseConfigured } from '@/config/appConfig';

export { isFirebaseConfigured };

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  _app = initializeApp({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
  _auth = getAuth(_app);

  try {
    // Rendimiento y Resiliencia No Funcional: Caché persistente multi-pestaña para emergencias territoriales
    _db = initializeFirestore(_app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    _db = getFirestore(_app);
  }

  try {
    _storage = getStorage(_app);
  } catch {
    _storage = null;
  }
}

export const app = _app;
export const auth = _auth;
export const db = _db;
export const storage = _storage;

/** Acceso seguro a los servicios; lanza un error claro si no están configurados. */
export function requireFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore; storage?: FirebaseStorage | null } {
  if (!_app || !_auth || !_db) {
    throw new Error('Firebase no está configurado. Definí las variables VITE_FIREBASE_* y usá VITE_DATA_MODE=firebase.');
  }
  return { app: _app, auth: _auth, db: _db, storage: _storage };
}

