'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
  Modal,
} from '@mui/material';
import BackButton from '@/components/BackButton';
import letters from '@/data/letters';
import numbers from '@/data/numbers';
import shapes from '@/data/shapes';
import animals from '@/data/animals';
import food from '@/data/food';
import { shuffle } from '@/utils/common';
import MemoryMatchCard from '@/components/MemoryMatchCard';
import { MemoryMatchCardModel } from '@/models/MemoryMatchCardModel';
import FunButton from '@/components/FunButton';
import RoundFunButton from '@/components/RoundFunButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTranslations } from 'next-intl';
import { useGameAnalytics } from '@/hooks/useGameAnalytics';
import { useCelebration } from '@/hooks/useCelebration';
import Celebration from '@/components/Celebration';
import { useGamesProgressContext } from '@/contexts/GamesProgressContext';

const CARD_OPTIONS = [6, 10, 20, 40, 70, 100] as const;

const modalBoxSx = (theme: any) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 300,
  bgcolor: theme.palette.colors.beigePastel,
  boxShadow: 24,
  borderRadius: '16px',
  p: 4,
  textAlign: 'center',
});

const CARD_CONFIGS = [
  { data: letters.slice(0, 22), key: 'letters', useTranslation: true },
  { data: numbers, key: 'numbers', useTranslation: true },
  { data: shapes, key: 'shapes', useTranslation: true, hasElement: true },
  { data: animals, key: 'animals', hasImage: true },
  { data: food, key: 'food', hasImage: true },
] as const;

const generateCards = (numCards: number, t: any): MemoryMatchCardModel[] => {
  const items: Omit<MemoryMatchCardModel, 'id' | 'matched'>[] = CARD_CONFIGS.flatMap((config) =>
    (config.data as any[]).map((item) => ({
      type: item.type,
      name: 'hasImage' in config ? item.imageUrl : t(`${config.key}.${item.id}.name`),
      textColor: item.color,
      ...('hasElement' in config && { element: item.element }),
      ...('hasImage' in config && { imageUrl: item.imageUrl }),
    }))
  );

  const shuffledItems = shuffle(items);
  const selectedItems = shuffledItems.slice(0, numCards / 2);
  const cards = selectedItems.flatMap((item, index) => [
    { ...item, id: index * 2, matched: false },
    { ...item, id: index * 2 + 1, matched: false },
  ]);

  return shuffle(cards);
};

export default function MemoryMatchGameContent() {
  const t = useTranslations();
  const { trackGameStarted, trackGameCompleted } = useGameAnalytics({ gameType: 'memory-match-game' });
  const { celebrationState, celebrate, resetCelebration } = useCelebration();
  const { recordGameCompleted } = useGamesProgressContext();
  const [numCards, setNumCards] = useState<number>(10);
  const [cards, setCards] = useState<MemoryMatchCardModel[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Initialize cards on client side only
  useEffect(() => {
    setCards(generateCards(numCards, t));
  }, []);

  const resetGame = useCallback(() => {
    setIsResetting(true);
    setIsGameWon(false);

    setCards((prevCards) => prevCards.map((card) => ({ ...card, matched: false })));
    setFlippedCards([]);

    setTimeout(() => {
      setCards(generateCards(numCards, t));
      setIsResetting(false);
      trackGameStarted();
    }, 600);
  }, [numCards, t, trackGameStarted]);

  useEffect(() => {
    if (cards.length > 0) {
      resetGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional: only reset on numCards change, not resetGame identity
  }, [numCards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.matched)) {
      setIsGameWon(true);
      celebrate('gameComplete');
      trackGameCompleted(numCards); // Score is number of cards matched
      recordGameCompleted('memory-match-game', numCards);
    }
  }, [cards, numCards, trackGameCompleted, celebrate, recordGameCompleted]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstCard, secondCard] = flippedCards;
      if (cards[firstCard].name === cards[secondCard].name) {
        setCards((prevCards) =>
          prevCards.map((card, index) =>
            index === firstCard || index === secondCard ? { ...card, matched: true } : card
          )
        );
        setFlippedCards([]);
      } else {
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  }, [flippedCards, cards]);

  const handleCardClick = useCallback(
    (index: number) => {
      if (flippedCards.length < 2 && !flippedCards.includes(index) && !cards[index].matched) {
        setFlippedCards((prev) => [...prev, index]);
      }
    },
    [flippedCards, cards]
  );

  const handleNumCardsChange = (event: SelectChangeEvent<number>) => {
    setNumCards(event.target.value as number);
  };

  const showModal = () => (
    <Modal open={isGameWon} onClose={resetGame} aria-labelledby="congratulations-modal">
      <Box sx={modalBoxSx}>
        <Typography id="congratulations-modal" variant="h5" component="h1" sx={{ mb: 4 }}>
          🥳 {t('games.memoryMatchGame.winMessage')}
        </Typography>
        <FunButton onClick={resetGame} text={t('games.memoryMatchGame.reset')} fontSize={18} />
      </Box>
    </Modal>
  );

  const showConfetti = () => (
    <Celebration celebrationState={celebrationState} onComplete={resetCelebration} />
  );

  const showCards = () => (
    <Grid container spacing={{ xs: 2, sm: 4 }} justifyContent="center">
      {cards.map((card, index) => (
        <Grid key={card.id}>
          <MemoryMatchCard card={card} flipped={flippedCards.includes(index) || card.matched} onClick={() => !isResetting && handleCardClick(index)} />
        </Grid>
      ))}
    </Grid>
  );

  const showHeaders = () => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <RoundFunButton onClick={resetGame}>
        <RefreshIcon />
      </RoundFunButton>
      <FormControl sx={{ width: 100 }}>
        <InputLabel id="num-cards-label">{t('games.memoryMatchGame.cardsNumber')}</InputLabel>
        <Select dir="rtl" labelId="num-cards-label" id="num-cards-select" value={numCards} label={t('games.memoryMatchGame.cardsNumber')} onChange={handleNumCardsChange}>
          {CARD_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <BackButton href="/games" />
    </Box>
  );

  return (
    <Box>
      {showConfetti()}
      {showModal()}
      {showHeaders()}
      {showCards()}
    </Box>
  );
}
