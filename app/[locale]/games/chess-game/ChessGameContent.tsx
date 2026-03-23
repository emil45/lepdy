'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { playSound, playRandomCelebration, AudioSounds } from '@/utils/audio';
import { logEvent } from '@/utils/amplitude';
import { AmplitudeEventsEnum } from '@/models/amplitudeEvents';
import Confetti from 'react-confetti';
import ChessSettingsDrawer from './ChessSettingsDrawer';
import ChessHubMenu from './ChessHubMenu';
import PieceIntroduction from './PieceIntroduction';
import StreakBadge from './StreakBadge';
import SessionCompleteScreen from './SessionCompleteScreen';
import PracticePicker from './PracticePicker';
import { usePracticeSession } from '@/hooks/usePracticeSession';

const MovementPuzzle = dynamic(() => import('./MovementPuzzle'), { ssr: false });
const CapturePuzzle = dynamic(() => import('./CapturePuzzle'), { ssr: false });
const CheckmatePuzzle = dynamic(() => import('./CheckmatePuzzle'), { ssr: false });

type ChessView = 'hub' | 'level-1' | 'session' | 'daily' | 'practice-picker' | 'practice';

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
  const { currentPuzzle: practicePuzzle, consecutiveCorrect: practiceStreak, onAnswer: practiceOnAnswer, startPractice, currentTiersByPiece: practiceTiersByPiece } = usePracticeSession();

  const handleAnswer = useCallback((correct: boolean) => {
    playSound(correct ? AudioSounds.SUCCESS : AudioSounds.WRONG_ANSWER);

    if (currentPuzzle) {
      const pieceId =
        currentPuzzle.type === 'movement'
          ? currentPuzzle.puzzle.pieceId
          : currentPuzzle.type === 'capture'
          ? currentPuzzle.puzzle.correctPieceId
          : currentPuzzle.puzzle.matingPieceId;
      logEvent(AmplitudeEventsEnum.CHESS_PUZZLE_ANSWERED, {
        puzzle_type: currentPuzzle.type,
        correct,
        piece_id: pieceId,
        difficulty: currentPuzzle.puzzle.difficulty,
        session_index: sessionIndex,
      });
    }

    onAnswer(correct);
  }, [onAnswer, currentPuzzle, sessionIndex]);

  const handleCheckmateAnswer = useCallback((correct: boolean) => {
    // CheckmatePuzzle plays WRONG_ANSWER internally on wrong taps and playRandomCelebration on correct.
    // Only play SUCCESS here on correct to complement the celebration — avoid double WRONG_ANSWER.
    if (correct) {
      playSound(AudioSounds.SUCCESS);
    }

    if (currentPuzzle && currentPuzzle.type === 'checkmate') {
      logEvent(AmplitudeEventsEnum.CHESS_PUZZLE_ANSWERED, {
        puzzle_type: 'checkmate',
        correct,
        piece_id: currentPuzzle.puzzle.matingPieceId,
        difficulty: currentPuzzle.puzzle.difficulty,
        session_index: sessionIndex,
      });
    }

    onAnswer(correct);
  }, [onAnswer, currentPuzzle, sessionIndex]);

  const handlePracticeAnswer = useCallback((correct: boolean) => {
    playSound(correct ? AudioSounds.SUCCESS : AudioSounds.WRONG_ANSWER);
    practiceOnAnswer(correct);
  }, [practiceOnAnswer]);

  const STREAK_MILESTONES = new Set([3, 5, 10]);
  const [showMilestoneConfetti, setShowMilestoneConfetti] = useState(false);

  useEffect(() => {
    if (!STREAK_MILESTONES.has(consecutiveCorrect)) return;
    setShowMilestoneConfetti(true);
    playRandomCelebration();
    const timer = setTimeout(() => setShowMilestoneConfetti(false), 2500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consecutiveCorrect]);

  useEffect(() => {
    if (!STREAK_MILESTONES.has(practiceStreak) || practiceStreak === 0) return;
    setShowMilestoneConfetti(true);
    playRandomCelebration();
    const timer = setTimeout(() => setShowMilestoneConfetti(false), 2500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceStreak]);

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
            {showMilestoneConfetti && (
              <Confetti
                recycle={false}
                numberOfPieces={150}
                gravity={0.3}
                style={{ position: 'fixed', top: 0, left: 0, zIndex: 1300 }}
              />
            )}
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
              onAnswer={handleAnswer}
              onExit={() => setCurrentView('hub')}
            />
          </div>
        </Fade>
      );
    }

    if (currentPuzzle.type === 'checkmate') {
      return (
        <Fade in={true} timeout={300}>
          <div>
            {showMilestoneConfetti && (
              <Confetti
                recycle={false}
                numberOfPieces={150}
                gravity={0.3}
                style={{ position: 'fixed', top: 0, left: 0, zIndex: 1300 }}
              />
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, mt: 1 }}>
              <StreakBadge count={consecutiveCorrect} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {progressText}
              </Typography>
            </Box>
            <CheckmatePuzzle
              puzzle={currentPuzzle.puzzle}
              onAnswer={handleCheckmateAnswer}
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
          {showMilestoneConfetti && (
            <Confetti
              recycle={false}
              numberOfPieces={150}
              gravity={0.3}
              style={{ position: 'fixed', top: 0, left: 0, zIndex: 1300 }}
            />
          )}
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
            onAnswer={handleAnswer}
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
      } else {
        playSound(AudioSounds.WRONG_ANSWER);
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

  if (currentView === 'practice-picker') {
    return (
      <Fade in={true} timeout={300}>
        <div>
          <PracticePicker
            currentTiersByPiece={practiceTiersByPiece}
            onSelectPiece={(pieceId) => {
              startPractice(pieceId);
              setCurrentView('practice');
            }}
            onBack={() => setCurrentView('hub')}
          />
        </div>
      </Fade>
    );
  }

  if (currentView === 'practice') {
    if (!practicePuzzle) return null;

    if (practicePuzzle.type === 'movement') {
      return (
        <Fade in={true} timeout={300}>
          <div>
            {showMilestoneConfetti && (
              <Confetti
                recycle={false}
                numberOfPieces={150}
                gravity={0.3}
                style={{ position: 'fixed', top: 0, left: 0, zIndex: 1300 }}
              />
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, mt: 1 }}>
              <StreakBadge count={practiceStreak} />
            </Box>
            <MovementPuzzle
              puzzle={practicePuzzle.puzzle}
              onAnswer={handlePracticeAnswer}
              onExit={() => setCurrentView('practice-picker')}
            />
          </div>
        </Fade>
      );
    }

    // Capture puzzle (practice sessions do not include checkmate puzzles)
    if (practicePuzzle.type !== 'capture') return null;

    return (
      <Fade in={true} timeout={300}>
        <div>
          {showMilestoneConfetti && (
            <Confetti
              recycle={false}
              numberOfPieces={150}
              gravity={0.3}
              style={{ position: 'fixed', top: 0, left: 0, zIndex: 1300 }}
            />
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, mt: 1 }}>
            <StreakBadge count={practiceStreak} />
          </Box>
          <CapturePuzzle
            puzzle={practicePuzzle.puzzle}
            onAnswer={handlePracticeAnswer}
            onExit={() => setCurrentView('practice-picker')}
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
            <ChessHubMenu onNavigate={setCurrentView} isDailyCompleted={isDailyCompleted} currentTiersByPiece={currentTiersByPiece} />
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
