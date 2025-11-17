# Minigames-App

Minigames-App is a mobile-focused bundle of casual games built with React Native and Expo. It includes a memory match, trivia quiz, hangman, tap-speed challenge, and tic-tac-toe in both single-player and Firestore-powered multiplayer modes, all sharing one cohesive interface and score-tracking system.

## Live Demo
- Hosted web build: https://minigames-app-60e24.web.app

## Tech Stack
- **Expo 53 / React Native 0.79** - deploys to mobile and web from one codebase.
- **TypeScript** - typed gameplay logic and components.
- **React Navigation** - screen-to-screen transitions.
- **AsyncStorage** - persists local stats for each game.
- **Firebase Firestore** - real-time sync for multiplayer tic-tac-toe.
- **Axios + Open Trivia DB** - fetches quiz questions on the fly.
- **Jest / ESLint** - unit tests (tic-tac-toe logic) and linting.

## Setup
- Copy `.env.example` to `.env` and fill the `EXPO_PUBLIC_FIREBASE_*` values with your own Firebase project (Firestore enabled).
- Install dependencies with `npm install` (use `--legacy-peer-deps` if npm reports peer conflicts).
- Start the Expo bundler with `npx expo start --clear` to wipe cached assets after changes.

## Available scripts
- `npm run start` - start Metro bundler (default platform prompt).
- `npm run android` / `npm run ios` / `npm run web` - launch directly on the selected platform.
- `npm run lint` - run ESLint across the TypeScript sources.
- `npm test` - execute unit tests (currently covering tic-tac-toe logic).

## Notes
- Multiplayer tic-tac-toe expects a configured Cloud Firestore instance;
- Game statistics are stored locally with AsyncStorage.
