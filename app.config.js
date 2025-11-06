const defaultFirebaseConfig = {
  apiKey: 'AIzaSyC5izWiEwirQxRX08Nr_-WzidBV5xvOOsg',
  authDomain: 'minigames-app-60e24.firebaseapp.com',
  projectId: 'minigames-app-60e24',
  storageBucket: 'minigames-app-60e24.firebasestorage.app',
  messagingSenderId: '277585238418',
  appId: '1:277585238418:web:ae7323a4f77b679b43c94b',
};

module.exports = ({ config }) => {
  const expoConfig = config.expo || {};

  return {
    ...config,
    expo: {
      ...expoConfig,
      name: 'MiniGamesApp',
      slug: 'MiniGamesApp',
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      newArchEnabled: true,
      splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
      ios: {
        supportsTablet: true,
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#ffffff',
        },
      },
      web: {
        favicon: './assets/favicon.png',
      },
      extra: {
        firebase: {
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
          messagingSenderId:
            process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
        },
      },
    },
  };
};
