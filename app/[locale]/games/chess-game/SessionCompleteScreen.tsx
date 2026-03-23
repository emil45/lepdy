'use client';

import { useState, MutableRefObject } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import Confetti from 'react-confetti';
import { useTranslations } from 'next-intl';
import { useFeatureFlagContext } from '@/contexts/FeatureFlagContext';
import { chessPieces } from '@/data/chessPieces';
import { PiecePuzzleProgress } from '@/hooks/usePuzzleProgress';
import { getBandKey, getTierColor } from '@/utils/chessMastery';

interface SessionCompleteScreenProps {
  firstTryCount: number;
  sessionTiers: MutableRefObject<Record<string, 1 | 2 | 3>>;
  currentTiersByPiece: Record<string, PiecePuzzleProgress>;
  pieceAnswerCounts: Record<string, { correct: number; total: number }>;
  onStartNew: () => void;
  onBackToMap: () => void;
}

export default function SessionCompleteScreen({
  firstTryCount,
  sessionTiers,
  currentTiersByPiece,
  pieceAnswerCounts,
  onStartNew,
  onBackToMap,
}: SessionCompleteScreenProps) {
  const t = useTranslations('chessGame');
  const { getFlag } = useFeatureFlagContext();

  const threshold3 = getFlag('chessStarThreshold3');
  const threshold2 = getFlag('chessStarThreshold2');
  const stars: 1 | 2 | 3 = firstTryCount >= threshold3 ? 3 : firstTryCount >= threshold2 ? 2 : 1;

  const [showConfetti] = useState(stars === 3);

  // Pieces excluding pawn — pawn has no puzzles in session queue
  const piecesForDisplay = chessPieces.filter((p) => p.id !== 'pawn');

  // Detect which pieces advanced tier during this session
  const advancedPieces: string[] = [];
  for (const piece of piecesForDisplay) {
    const startTier = sessionTiers.current[piece.id] ?? 1;
    const currentTier = currentTiersByPiece[piece.id]?.tier ?? 1;
    if (currentTier > startTier) {
      advancedPieces.push(piece.id);
    }
  }

  return (
    <Fade in={true} timeout={300}>
      <Box>
        {showConfetti && (
          <Confetti recycle={false} numberOfPieces={200} gravity={0.25} />
        )}

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2,
            px: 2,
          }}
        >
          {/* Session complete title */}
          <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            {t('ui.sessionComplete')}
          </Typography>

          {/* Star row — direction ltr for RTL-safe badge display */}
          <Box sx={{ direction: 'ltr', display: 'flex', gap: 1, my: 2 }}>
            {[1, 2, 3].map((i) =>
              i <= stars ? (
                <StarIcon key={i} sx={{ fontSize: 56, color: '#ffd700' }} />
              ) : (
                <StarBorderIcon key={i} sx={{ fontSize: 56, color: '#ccc' }} />
              )
            )}
          </Box>

          {/* Score text */}
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            {t('ui.score', { count: firstTryCount })}
          </Typography>

          {/* Per-piece breakdown section */}
          {(() => {
            const sessionPieces = chessPieces.filter((p) => pieceAnswerCounts[p.id]);
            return sessionPieces.length > 0 ? (
              <Box
                data-testid="piece-breakdown-section"
                sx={{ mt: 2, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 1 }}
              >
                {sessionPieces.map((piece) => {
                  const counts = pieceAnswerCounts[piece.id];
                  return (
                    <Box
                      key={piece.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: piece.color,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        opacity: 0.85,
                      }}
                    >
                      <Typography sx={{ fontSize: 28, lineHeight: 1 }}>{piece.emoji}</Typography>
                      <Typography sx={{ fontWeight: 'bold', flex: 1 }}>
                        {t(piece.translationKey as Parameters<typeof t>[0])}
                      </Typography>
                      <Typography sx={{ fontWeight: 'bold' }}>
                        {t('ui.pieceAnswerCount' as Parameters<typeof t>[0], { correct: counts.correct, total: counts.total })}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            ) : null;
          })()}

          {/* Mastery section */}
          <Box
            sx={{
              mt: 3,
              width: '100%',
              maxWidth: 400,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {piecesForDisplay.map((piece) => {
              const tier = currentTiersByPiece[piece.id]?.tier ?? 1;
              const advanced = advancedPieces.includes(piece.id);
              return (
                <Box key={piece.id}>
                  <Chip
                    label={`${piece.emoji} ${t(piece.translationKey as Parameters<typeof t>[0])} — ${t(getBandKey(tier) as Parameters<typeof t>[0])}`}
                    sx={{
                      bgcolor: getTierColor(tier),
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      py: 2,
                      justifyContent: 'center',
                      width: '100%',
                    }}
                  />
                  {advanced && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                      }}
                    >
                      <ArrowUpwardIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                      <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                        {t('ui.gettingHarder')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Buttons */}
          <Box
            sx={{
              mt: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              width: '100%',
              maxWidth: 300,
            }}
          >
            <Button variant="contained" onClick={onStartNew} size="large">
              {t('ui.startNewSession')}
            </Button>
            <Button variant="outlined" onClick={onBackToMap} size="large">
              {t('ui.back')}
            </Button>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}
