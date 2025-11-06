import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

type ExtraConfig = {
  firebase?: FirebaseOptions;
};

const extras = (Constants.expoConfig?.extra as ExtraConfig | undefined)?.firebase;

const fallbackConfig: FirebaseOptions = {
  apiKey: 'AIzaSyC5izWiEwirQxRX08Nr_-WzidBV5xvOOsg',
  authDomain: 'minigames-app-60e24.firebaseapp.com',
  projectId: 'minigames-app-60e24',
  storageBucket: 'minigames-app-60e24.firebasestorage.app',
  messagingSenderId: '277585238418',
  appId: '1:277585238418:web:ae7323a4f77b679b43c94b',
};

const firebaseConfig: FirebaseOptions = {
  ...fallbackConfig,
  ...extras,
};

const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
