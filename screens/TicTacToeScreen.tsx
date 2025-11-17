import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../App';
import showAlert from '../utils/showAlert';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { surfaces } from '../styles/commonStyles';
import {
  Board,
  PlayerSymbol,
  bestAvailableMove,
  checkWinner,
  findBestMove,
  randomMove,
} from '../logic/ticTacToe';

type Props = NativeStackScreenProps<RootStackParamList, 'TicTacToe'>;

const updateTttWins = async () => {
  const wins = parseInt((await AsyncStorage.getItem('tttWins')) || '0', 10);
  await AsyncStorage.setItem('tttWins', String(wins + 1));
};

const computerSymbol: PlayerSymbol = 'O';
const playerSymbol: PlayerSymbol = 'X';

export default function TicTacToeScreen({ navigation }: Props) {
  const [board, setBoard] = useState<Board>(Array(9).fill(''));
  const [playerTurn, setPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(''));
    setPlayerTurn(true);
    setGameOver(false);
  }, []);

  const finishGame = useCallback(
    (result: 'player' | 'computer' | 'draw') => {
      setGameOver(true);
      setPlayerTurn(true);

      if (result === 'player') {
        void updateTttWins();
        showAlert(strings.ttt.playerWin, undefined, [
          { text: strings.common.menu, onPress: () => navigation.navigate('Home') },
          { text: strings.common.playAgain, onPress: resetGame },
        ]);
      } else if (result === 'computer') {
        showAlert(strings.ttt.computerWin, undefined, [
          { text: strings.common.menu, onPress: () => navigation.navigate('Home') },
          { text: strings.common.playAgain, onPress: resetGame },
        ]);
      } else {
        showAlert(strings.ttt.draw, undefined, [
          { text: strings.common.menu, onPress: () => navigation.navigate('Home') },
          { text: strings.common.playAgain, onPress: resetGame },
        ]);
      }
    },
    [navigation, resetGame],
  );

  const makeMove = useCallback(
    (index: number, symbol: PlayerSymbol) => {
      if (gameOver) {
        return;
      }

      setBoard(prev => {
        if (prev[index]) {
          return prev;
        }

        const updated = [...prev];
        updated[index] = symbol;

        if (checkWinner(updated, symbol)) {
          finishGame(symbol === playerSymbol ? 'player' : 'computer');
          return updated;
        }

        if (!updated.includes('')) {
          finishGame('draw');
          return updated;
        }

        return updated;
      });
    },
    [finishGame, gameOver],
  );

  const handleTap = (index: number) => {
    if (board[index] || gameOver || !playerTurn) {
      return;
    }
    makeMove(index, playerSymbol);
    setPlayerTurn(false);
  };

  const computerSmartMove = useCallback(() => {
    if (gameOver) {
      return;
    }

    const smartMoveProbability = 0.7;
    const doSmartMove = Math.random() < smartMoveProbability;

    let move: number | null = null;
    if (doSmartMove) {
      move =
        findBestMove(board, computerSymbol) ?? findBestMove(board, playerSymbol) ?? bestAvailableMove(board);
    } else {
      move = randomMove(board);
    }

    if (move !== null) {
      makeMove(move, computerSymbol);
    }

    setPlayerTurn(true);
  }, [board, gameOver, makeMove]);

  useEffect(() => {
    if (!playerTurn && !gameOver) {
      const timeout = setTimeout(computerSmartMove, 500);
      return () => clearTimeout(timeout);
    }
  }, [playerTurn, gameOver, computerSmartMove]);

  return (
    <LinearGradient colors={colors.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.panel}>
          <Text style={styles.title}>{strings.ttt.title}</Text>
          <Text style={styles.subtitle}>
            Play as X. The assistant mixes smart and random moves for variety.
          </Text>
          <View style={styles.board}>
            {board.map((cell, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.cell}
                onPress={() => handleTap(idx)}
                disabled={Boolean(cell) || gameOver}
              >
                <Text style={styles.symbol}>{cell}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Text style={styles.resetButtonText}>{strings.common.reset}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.homeButtonText}>{strings.common.backToMenu}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, padding: 20 },
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    ...surfaces.roundedCard,
    borderWidth: 0,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.textLight },
  subtitle: { color: colors.textMuted, textAlign: 'center', marginVertical: 12 },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cell: {
    width: '33.33%',
    height: '33.33%',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { fontSize: 40, color: colors.textLight },
  actions: { width: '100%', gap: 12 },
  resetButton: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.quizPrimary,
    alignItems: 'center',
  },
  resetButtonText: { color: colors.textLight, fontSize: 16, fontWeight: '600' },
  homeButton: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  homeButtonText: { color: colors.textLight, fontSize: 16 },
});
