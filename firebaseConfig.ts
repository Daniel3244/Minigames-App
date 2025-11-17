import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

type ExtraConfig = {
  firebase?: FirebaseOptions;
};

const extras = (Constants.expoConfig?.extra as ExtraConfig | undefined)?.firebase;

const firebaseConfig: FirebaseOptions = {
  ...extras,
};

const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
