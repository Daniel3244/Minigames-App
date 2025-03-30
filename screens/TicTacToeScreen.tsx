import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

const updateTttWins = async () => {
  const wins = parseInt((await AsyncStorage.getItem('tttWins')) || '0');
  await AsyncStorage.setItem('tttWins', (wins + 1).toString());
};


type Props = NativeStackScreenProps<RootStackParamList, 'TicTacToe'>;

export default function TicTacToeScreen({ navigation }: Props) {
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [playerTurn, setPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  const handleTap = (index: number) => {
    if (board[index] || gameOver || !playerTurn) return;
    makeMove(index, '❌');
    setPlayerTurn(false);
  };

  useEffect(() => {
    if (!playerTurn && !gameOver) {
      setTimeout(computerSmartMove, 500);
    }
  }, [playerTurn, gameOver]);

  const makeMove = (index: number, symbol: string) => {
    const newBoard = [...board];
    newBoard[index] = symbol;
    setBoard(newBoard);

    if (checkWinner(newBoard, symbol)) {
      if (symbol === '❌') updateTttWins();
      setGameOver(true);
      Alert.alert(symbol === '❌' ? '🥳 Wygrywasz!' : '🤖 Komputer wygrał!', '', [
        { text: '🏠 Menu', onPress: () => navigation.navigate('Home') },
        { text: '🔄 Jeszcze raz', onPress: resetGame },
      ]);
    } else if (!newBoard.includes('')) {
      setGameOver(true);
      Alert.alert('😐 Remis!', '', [
        { text: '🏠 Menu', onPress: () => navigation.navigate('Home') },
        { text: '🔄 Jeszcze raz', onPress: resetGame },
      ]);
    }
  };

  const computerSmartMove = () => {
    const smartMoveProbability = 0.7;
    const doSmartMove = Math.random() < smartMoveProbability;

    let move = null;
    if (doSmartMove) {
      move = findBestMove('⭕') ?? findBestMove('❌') ?? bestAvailableMove();
    } else {
      move = randomMove();
    }

    if (move !== null) {
      makeMove(move, '⭕');
      setPlayerTurn(true);
    }
  };

  const randomMove = () => {
    const emptyIndices = board.map((v, i) => (v === '' ? i : null)).filter(v => v !== null) as number[];
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  };

  const findBestMove = (symbol: string) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let [a, b, c] of lines) {
      if (board[a] === symbol && board[b] === symbol && board[c] === '') return c;
      if (board[a] === symbol && board[c] === symbol && board[b] === '') return b;
      if (board[b] === symbol && board[c] === symbol && board[a] === '') return a;
    }
    return null;
  };

  const bestAvailableMove = () => {
    const preferred = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    return preferred.find(i => board[i] === '') ?? null;
  };

  const checkWinner = (board: string[], symbol: string) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    return lines.some(([a, b, c]) => board[a] === symbol && board[b] === symbol && board[c] === symbol);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(''));
    setPlayerTurn(true);
    setGameOver(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kółko i Krzyżyk</Text>
      <View style={styles.board}>
        {board.map((cell, idx) => (
          <TouchableOpacity key={idx} style={styles.cell} onPress={() => handleTap(idx)}>
            <Text style={styles.symbol}>{cell}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
        <Text style={styles.resetButtonText}>🔄 Resetuj</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeButtonText}>🔙 Menu Główne</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  board: { flexDirection: 'row', flexWrap: 'wrap', width: 300, height: 300 },
  cell: { width: '33%', height: '33%', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  symbol: { fontSize: 40 },
  resetButton: { marginTop: 20, padding: 10, backgroundColor: '#4c8bf5', borderRadius: 8 },
  resetButtonText: { color: 'white', fontSize: 16 },
  homeButton: { marginTop: 10 },
  homeButtonText: { color: '#333', fontSize: 16 },
});
