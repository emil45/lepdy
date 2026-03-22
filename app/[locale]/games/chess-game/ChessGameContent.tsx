'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslations } from 'next-intl';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import dynamic from 'next/dynamic';
import BackButton from '@/components/BackButton';
import { useChessProgress } from '@/hooks/useChessProgress';
import { useChessPieceTheme } from '@/hooks/useChessPieceTheme';
import ChessSettingsDrawer from './ChessSettingsDrawer';
import PieceIntroduction from './PieceIntroduction';

const MovementPuzzle = dynamic(() => import('./MovementPuzzle'), { ssr: false });
const CapturePuzzle = dynamic(() => import('./CapturePuzzle'), { ssr: false });

type ChessView = 'map' | 'level-1' | 'level-2' | 'level-3';

const LEVELS = [
  { num: 1, nameKey: 'levels.pieceIntro' as const, emoji: '\u2654', color: '#9ed6ea' },
  { num: 2, nameKey: 'levels.movement' as const, emoji: '\u2656', color: '#dbc3e2' },
  { num: 3, nameKey: 'levels.capture' as const, emoji: '\u265F', color: '#ffcd36' },
];

interface LevelMapCardProps {
  levelNumber: number;
  levelName: string;
  emoji: string;
  bgColor: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  onSelect: () => void;
}

function LevelMapCard({ levelNumber, levelName, emoji, bgColor, isUnlocked, isCompleted, onSelect }: LevelMapCardProps) {
  return (
    <Card
      data-testid="level-card"
      sx={{
        minHeight: 90,
        borderRadius: 3,
        mb: 2,
        opacity: isUnlocked ? 1 : 0.5,
        bgcolor: isUnlocked ? bgColor : 'grey.300',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <CardActionArea
        disabled={!isUnlocked}
        onClick={onSelect}
        sx={{ height: '100%', minHeight: 90 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2, minWidth: 56 }}>
            <Typography sx={{ fontSize: 48, lineHeight: 1 }}>{emoji}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {levelNumber}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {levelName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            {!isUnlocked && <LockIcon sx={{ fontSize: 28 }} />}
            {isCompleted && (
              <Box data-testid="level-card-completed" sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 28, mr: 0.5 }} />
                <StarIcon sx={{ color: '#ffd700', fontSize: 28 }} />
              </Box>
            )}
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}

export default function ChessGameContent() {
  const [currentView, setCurrentView] = useState<ChessView>('map');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const t = useTranslations('chessGame');
  const { isLevelUnlocked, isLevelCompleted, completeLevel } = useChessProgress();
  const { theme, selectTheme } = useChessPieceTheme();

  if (currentView === 'level-1') {
    return (
      <Fade in={true} timeout={300}>
        <div>
          <PieceIntroduction onComplete={() => setCurrentView('map')} completeLevel={completeLevel} />
        </div>
      </Fade>
    );
  }

  if (currentView === 'level-2') {
    return (
      <Fade in={true} timeout={300}>
        <div>
          <MovementPuzzle onComplete={() => setCurrentView('map')} completeLevel={completeLevel} />
        </div>
      </Fade>
    );
  }

  if (currentView === 'level-3') {
    return (
      <Fade in={true} timeout={300}>
        <div>
          <CapturePuzzle onComplete={() => setCurrentView('map')} completeLevel={completeLevel} />
        </div>
      </Fade>
    );
  }

  return (
    <Fade in={true} timeout={300}>
      <Box sx={{ py: 2, px: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
        <Box sx={{ width: '100%', maxWidth: 520, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <BackButton href="/games" />
          <IconButton
            onClick={() => setSettingsOpen(true)}
            sx={{ color: 'secondary.main' }}
            aria-label="settings"
          >
            <SettingsIcon />
          </IconButton>
        </Box>
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
          {t('title')}
        </Typography>
        <Box sx={{ width: '100%', maxWidth: 520, mt: 2 }}>
          {LEVELS.map((level) => (
            <LevelMapCard
              key={level.num}
              levelNumber={level.num}
              levelName={t(level.nameKey)}
              emoji={level.emoji}
              bgColor={level.color}
              isUnlocked={isLevelUnlocked(level.num)}
              isCompleted={isLevelCompleted(level.num)}
              onSelect={() => setCurrentView(`level-${level.num}` as ChessView)}
            />
          ))}
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
