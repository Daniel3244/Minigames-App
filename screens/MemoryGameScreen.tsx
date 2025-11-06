import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../App';
import showAlert from '../utils/showAlert';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { layout } from '../styles/commonStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'MemoryGame'>;

type Card = {
  icon: string;
  matched: boolean;
  opened: boolean;
  id: number;
};

const icons = ['apple', 'star', 'heart', 'music', 'rocket', 'gift'];

const updateMemoryWins = async () => {
  const wins = parseInt((await AsyncStorage.getItem('memoryWins')) || '0', 10);
  await AsyncStorage.setItem('memoryWins', String(wins + 1));
};

const createDeck = (): Card[] =>
  [...icons, ...icons]
    .sort(() => Math.random() - 0.5)
    .map((icon, id) => ({ icon, matched: false, opened: false, id }));

export default function MemoryGameScreen({ navigation }: Props) {
  const [cards, setCards] = useState<Card[]>(createDeck);
  const [openedCards, setOpenedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    startGame();
  }, []);

  const startGame = () => {
    setCards(createDeck());
    setOpenedCards([]);
    setScore(0);
  };

  const openCard = (index: number) => {
    if (cards[index].opened || openedCards.length === 2) {
      return;
    }

    const updatedCards = cards.map((card, cardIndex) =>
      cardIndex === index ? { ...card, opened: true } : card,
    );
    const nextOpened = [...openedCards, index];

    setCards(updatedCards);
    setOpenedCards(nextOpened);

    if (nextOpened.length === 2) {
      const [first, second] = nextOpened;
      const isMatch = updatedCards[first].icon === updatedCards[second].icon;

      if (isMatch) {
        const matchedCards = updatedCards.map((card, cardIndex) =>
          cardIndex === first || cardIndex === second ? { ...card, matched: true } : card,
        );
        setCards(matchedCards);
        setOpenedCards([]);

        setScore(prevScore => {
          const nextScore = prevScore + 1;
          if (nextScore === icons.length) {
            void updateMemoryWins();
            setTimeout(() => {
              showAlert(strings.memoryGame.winTitle, strings.memoryGame.winMessage, [
                { text: strings.common.menu, onPress: () => navigation.navigate('Home') },
                { text: strings.common.playAgain, onPress: startGame },
              ]);
            }, 400);
          }
          return nextScore;
        });
      } else {
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map((card, cardIndex) =>
              cardIndex === first || cardIndex === second ? { ...card, opened: false } : card,
            ),
          );
          setOpenedCards([]);
        }, 800);
      }
    }
  };

  const renderCard = ({ item, index }: { item: Card; index: number }) => (
    <TouchableOpacity style={styles.card} onPress={() => openCard(index)}>
      {item.opened || item.matched ? (
        <FontAwesome name={item.icon as any} size={30} color={colors.textDark} />
      ) : (
        <Text style={styles.hidden}>?</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.score}>{strings.memoryGame.scoreboard(score, icons.length)}</Text>
      <FlatList
        numColumns={4}
        data={cards}
        renderItem={renderCard}
        keyExtractor={item => item.id.toString()}
        style={styles.list}
      />
      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeButtonText}>{strings.common.backToMenu}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...layout.centered, paddingTop: 40 },
  card: {
    width: 70,
    height: 70,
    margin: 8,
    borderRadius: 10,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hidden: { fontSize: 24, color: '#888' },
  score: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  homeButton: { marginTop: 20, padding: 12 },
  homeButtonText: { color: colors.textDark, fontSize: 16 },
  list: { flexGrow: 0 },
});
