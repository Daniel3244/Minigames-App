import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import MemoryGameScreen from './screens/MemoryGameScreen';
import QuizGameScreen from './screens/QuizGameScreen';
import HangmanGameScreen from './screens/HangmanGameScreen';
import TapGameScreen from './screens/TapGameScreen';
import TicTacToeScreen from './screens/TicTacToeScreen';
import TicTacToeMultiplayerScreen from './screens/TicTacToeMultiplayerScreen';
import ScoreCardScreen from './screens/ScoreCardScreen';

export type RootStackParamList = {
  Home: undefined;
  MemoryGame: undefined;
  QuizGame: undefined;
  HangmanGame: undefined;
  TapGame: undefined;
  TicTacToe: undefined;
  TicTacToeMultiplayer: undefined;
  ScoreCard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MemoryGame" component={MemoryGameScreen} />
        <Stack.Screen name="QuizGame" component={QuizGameScreen} />
        <Stack.Screen name="HangmanGame" component={HangmanGameScreen} />
        <Stack.Screen name="TapGame" component={TapGameScreen} />
        <Stack.Screen name="TicTacToe" component={TicTacToeScreen} />
        <Stack.Screen name="TicTacToeMultiplayer" component={TicTacToeMultiplayerScreen} />
        <Stack.Screen name="ScoreCard" component={ScoreCardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
