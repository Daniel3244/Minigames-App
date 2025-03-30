import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'MemoryGame'>;

const icons = ['apple', 'star', 'heart', 'music', 'rocket', 'gift'];

const updateMemoryWins = async () => {
  const wins = parseInt((await AsyncStorage.getItem('memoryWins')) || '0');
  await AsyncStorage.setItem('memoryWins', (wins + 1).toString());
};

export default function MemoryGameScreen({ navigation }: Props) {
  const [cards, setCards] = useState<{ icon: string; matched: boolean; opened: boolean; id: number }[]>([]);
  const [openedCards, setOpenedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    startGame();
  }, []);

  const startGame = () => {
    const duplicatedIcons = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, id) => ({ icon, matched: false, opened: false, id }));
    setCards(duplicatedIcons);
    setOpenedCards([]);
    setScore(0);
  };

  const openCard = (index: number) => {
    if (cards[index].opened || openedCards.length === 2) return;

    const newCards = [...cards];
    newCards[index].opened = true;
    const newOpened = [...openedCards, index];
    setCards(newCards);
    setOpenedCards(newOpened);

    if (newOpened.length === 2) {
      if (newCards[newOpened[0]].icon === newCards[newOpened[1]].icon) {
        setScore(score + 1);
        newCards[newOpened[0]].matched = true;
        newCards[newOpened[1]].matched = true;
        setCards(newCards);
        setOpenedCards([]);
        if (score + 1 === icons.length) {
          updateMemoryWins();
          setTimeout(() => {
            Alert.alert('🎉 Wygrałeś!', 'Gratulacje!', [
              { text: '🏠 Menu', onPress: () => navigation.navigate('Home') },
              { text: '🔄 Jeszcze raz', onPress: startGame },
            ]);
          }, 500);
        }
      } else {
        setTimeout(() => {
          newCards[newOpened[0]].opened = false;
          newCards[newOpened[1]].opened = false;
          setCards(newCards);
          setOpenedCards([]);
        }, 800);
      }
    }
  };

  const renderCard = ({ item, index }: { item: typeof cards[0]; index: number }) => (
    <TouchableOpacity style={styles.card} onPress={() => openCard(index)}>
      {item.opened || item.matched ? (
        <FontAwesome name={item.icon as any} size={30} color="#333" />
      ) : (
        <Text style={styles.hidden}>?</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.score}>Pary: {score}/{icons.length}</Text>
      <FlatList 
        numColumns={4} 
        data={cards} 
        renderItem={renderCard} 
        keyExtractor={item => item.id.toString()} 
        style={{ flexGrow: 0 }}
        />
      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeButtonText}>🔙 Menu Główne</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  card: { width: 70, height: 70, margin: 8, borderRadius: 10, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  hidden: { fontSize: 24, color: '#888' },
  score: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  homeButton: { marginTop: 20, padding: 12 },
  homeButtonText: { color: '#333', fontSize: 16 },
});
