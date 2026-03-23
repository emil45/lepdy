'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import BackButton from '@/components/BackButton';
import RoundFunButton from '@/components/RoundFunButton';
import { useChessProgress } from '@/hooks/useChessProgress';
import { useChessPieceTheme } from '@/hooks/useChessPieceTheme';
import { usePuzzleSession } from '@/hooks/usePuzzleSession';
import { useDailyPuzzle } from '@/hooks/useDailyPuzzle';
import { playRandomCelebration } from '@/utils/audio';
import ChessSettingsDrawer from './ChessSettingsDrawer';
import ChessHubMenu from './ChessHubMenu';
import PieceIntroduction from './PieceIntroduction';
import StreakBadge from './StreakBadge';
import SessionCompleteScreen from './SessionCompleteScreen';

const MovementPuzzle = dynamic(() => import('./MovementPuzzle'), { ssr: false });
const CapturePuzzle = dynamic(() => import('./CapturePuzzle'), { ssr: false });

type ChessView = 'hub' | 'level-1' | 'session' | 'daily';

function assertNever(x: never): never {
  throw new Error('Unhandled ChessView: ' + x);
}

export default function ChessGameContent() {
  const [currentView, setCurrentView] = useState<ChessView>('hub');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const t = useTranslations('chessGame');
  const { completeLevel } = useChessProgress();
  const { theme, selectTheme } = useChessPieceTheme();
  const { currentPuzzle, sessionIndex, consecutiveCorrect, firstTryCount, isSessionComplete, onAnswer, startNewSession, sessionTiers, currentTiersByPiece } = usePuzzleSession();
  const { dailyPuzzle, isCompleted: isDailyCompleted, markCompleted: markDailyCompleted } = useDailyPuzzle();

  // Call completeLevel for both puzzle levels when session completes
  useEffect(() => {
    if (isSessionComplete) {
      completeLevel(2);
      completeLevel(3);
    }
  }, [isSessionComplete, completeLevel]);

  if (currentView === 'level-1') {
    return (
      <Fade in={true} timeout={300}>
        <div>
          <PieceIntroduction onComplete={() => setCurrentView('hub')} completeLevel={completeLevel} />
        </div>
      </Fade>
    );
  }

  if (currentView === 'session') {
    // Session complete screen
    if (isSessionComplete) {
      return (
        <SessionCompleteScreen
          firstTryCount={firstTryCount}
          sessionTiers={sessionTiers}
          currentTiersByPiece={currentTiersByPiece}
          onStartNew={startNewSession}
          onBackToMap={() => { startNewSession(); setCurrentView('hub'); }}
        />
      );
    }

    // Loading state while session initializes
    if (!currentPuzzle) return null;

    const progressText = t('ui.puzzleProgress', { current: sessionIndex + 1, total: 10 });

    if (currentPuzzle.type === 'movement') {
      return (
        <Fade in={true} timeout={300}>
          <div>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, mt: 1 }}>
              <StreakBadge count={consecutiveCorrect} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {progressText}
              </Typography>
            </Box>
            <MovementPuzzle
              puzzle={currentPuzzle.puzzle}
              onAnswer={onAnswer}
              onExit={() => setCurrentView('hub')}
            />
          </div>
        </Fade>
      );
    }

    // Capture puzzle
    return (
      <Fade in={true} timeout={300}>
        <div>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, mt: 1 }}>
            <StreakBadge count={consecutiveCorrect} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {progressText}
            </Typography>
          </Box>
          <CapturePuzzle
            puzzle={currentPuzzle.puzzle}
            onAnswer={onAnswer}
            onExit={() => setCurrentView('hub')}
          />
        </div>
      </Fade>
    );
  }

  if (currentView === 'daily') {
    const handleDailyAnswer = (correct: boolean) => {
      if (correct) {
        markDailyCompleted();
        playRandomCelebration();
        // Return to hub after puzzle animation settles
        setTimeout(() => setCurrentView('hub'), 800);
      }
    };

    if (dailyPuzzle.type === 'movement') {
      return (
        <Fade in={true} timeout={300}>
          <div>
            <MovementPuzzle
              puzzle={dailyPuzzle.puzzle}
              onAnswer={handleDailyAnswer}
              onExit={() => setCurrentView('hub')}
            />
          </div>
        </Fade>
      );
    }

    return (
      <Fade in={true} timeout={300}>
        <div>
          <CapturePuzzle
            puzzle={dailyPuzzle.puzzle}
            onAnswer={handleDailyAnswer}
            onExit={() => setCurrentView('hub')}
          />
        </div>
      </Fade>
    );
  }

  if (currentView === 'hub') {
    return (
      <Fade in={true} timeout={300}>
        <Box sx={{ py: 2, px: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
          <Box sx={{ width: '100%', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <RoundFunButton onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </RoundFunButton>
            <BackButton href="/games" />
          </Box>
          <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
            {t('title')}
          </Typography>
          <Box sx={{ width: '100%', maxWidth: 520, mt: 2, display: 'flex', justifyContent: 'center' }}>
            <ChessHubMenu onNavigate={setCurrentView} isDailyCompleted={isDailyCompleted} />
          </Box>
          <ChessSettingsDrawer
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            currentTheme={theme}
            onSelectTheme={selectTheme}
          />
        </Box>
      </Fade>
    );
  }

  return assertNever(currentView);
}
