'use client';

import React from 'react';
import FunButton from '@/components/FunButton';
import PageIntro from '@/components/PageIntro';
import PageHeader from '@/components/PageHeader';
import { Box } from '@mui/material';
import { useTranslations } from 'next-intl';

export default function GamesContent() {
  const t = useTranslations();

  return (
    <Box>
      <PageHeader />
      <Box sx={{ pt: 2 }}>
        <PageIntro pageName="games" />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <FunButton to="/games/simon-game" text={t('games.buttons.simon')} />
          <FunButton to="/games/sound-matching" text={t('games.buttons.soundMatching')} />
          <FunButton to="/games/letter-rain" text={t('games.buttons.letterRain')} />
          <FunButton to="/games/memory-match-game" text={t('games.buttons.memoryMatchGame')} />
          <FunButton to="/games/speed-challenge" text={t('games.buttons.speedChallenge')} />
          <FunButton to="/games/word-builder" text={t('games.buttons.wordBuilder')} />
          <FunButton to="/games/guess-game" text={t('games.buttons.guessGame')} />
          <FunButton to="/games/counting-game" text={t('games.buttons.countingGame')} />
          {/* letter-tracing game disabled - needs proper implementation */}
        </Box>
        </Box>
      </Box>
    </Box>
  );
}
