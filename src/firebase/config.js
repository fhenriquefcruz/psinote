import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore
} from 'firebase/firestore';
import {
  connectStorageEmulator,
  getStorage
} from 'firebase/storage';

const useEmulators =
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

const firebaseConfig = useEmulators
  ? {
      apiKey: 'demo-key',
      authDomain: 'localhost',
      projectId:
        import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-psinote-e2e',
      storageBucket:
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
        || 'demo-psinote-e2e.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:psinote-e2e'
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
    disableWarnings: true
  });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}
