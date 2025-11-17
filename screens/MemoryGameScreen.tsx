import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../App';
import showAlert from '../utils/showAlert';
import { strings } from '../constants/strings';
import { colors } from '../styles/theme';
import { surfaces } from '../styles/commonStyles';

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
        <FontAwesome name={item.icon as any} size={30} color={colors.textLight} />
      ) : (
        <Text style={styles.hidden}>?</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={colors.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.panel}>
          <Text style={styles.title}>Memory Match</Text>
          <Text style={styles.subtitle}>Flip two cards at a time and clear the grid faster.</Text>
          <View style={styles.scorePill}>
            <Text style={styles.scoreValue}>{strings.memoryGame.scoreboard(score, icons.length)}</Text>
          </View>
          <FlatList
            numColumns={4}
            data={cards}
            renderItem={renderCard}
            keyExtractor={item => item.id.toString()}
            style={styles.list}
            contentContainerStyle={styles.grid}
          />
          <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeButtonText}>{strings.common.backToMenu}</Text>
          </TouchableOpacity>
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
    padding: 20,
    ...surfaces.roundedCard,
    borderWidth: 0,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.textLight, marginBottom: 6 },
  subtitle: { color: colors.textMuted, marginBottom: 16, lineHeight: 20 },
  scorePill: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  scoreValue: { color: colors.textLight, fontWeight: '600' },
  grid: { alignItems: 'center' },
  card: {
    width: 66,
    height: 84,
    margin: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hidden: { fontSize: 24, color: colors.textMuted },
  homeButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  homeButtonText: { color: colors.textLight, fontSize: 16, fontWeight: '600' },
  list: { flexGrow: 0, alignSelf: 'center' },
});
