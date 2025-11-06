# Minigames-App

Minigames-App is a mobile-focused bundle of casual games built with React Native and Expo. It includes a memory match, trivia quiz, hangman, tap-speed challenge, and tic-tac-toe in both single-player and Firestore-powered multiplayer modes, all sharing one cohesive interface and score-tracking system.

## Tech Stack
- **Expo 53 / React Native 0.79** � deploys to mobile and web from one codebase.
- **TypeScript** � typed gameplay logic and components.
- **React Navigation** � screen-to-screen transitions.
- **AsyncStorage** � persists local stats for each game.
- **Firebase Firestore** � real-time sync for multiplayer tic-tac-toe.
- **Axios + Open Trivia DB** � fetches quiz questions on the fly.
- **Jest / ESLint** � unit tests (tic-tac-toe logic) and linting.

## Setup
- Copy `.env.example` to `.env` (or export the variables another way). If you leave the values empty the app falls back to the bundled demo Firebase config, but real deployments should supply project-specific keys.
- Install dependencies with `npm install` (use `--legacy-peer-deps` if npm reports peer conflicts).
- Start the Expo bundler with `npx expo start --clear` to wipe cached assets after changes.

## Available scripts
- `npm run start` � start Metro bundler (default platform prompt).
- `npm run android` / `npm run ios` / `npm run web` � launch directly on the selected platform.
- `npm run lint` � run ESLint across the TypeScript sources.
- `npm test` � execute unit tests (currently covering tic-tac-toe logic).

## Notes
- Multiplayer tic-tac-toe expects a configured Cloud Firestore instance. Update `.env` or `app.config.js` with project settings.
- Game statistics are stored locally with AsyncStorage.
