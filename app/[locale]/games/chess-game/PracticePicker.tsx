'use client';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslations } from 'next-intl';
import { chessPieces, ChessPieceId } from '@/data/chessPieces';
import { useChessPieceTheme } from '@/hooks/useChessPieceTheme';
import { playAudio } from '@/utils/audio';
import { PiecePuzzleProgress } from '@/hooks/usePuzzleProgress';

interface PracticePickerProps {
  currentTiersByPiece: Record<string, PiecePuzzleProgress>;
  onSelectPiece: (pieceId: ChessPieceId) => void;
  onBack: () => void;
}

function getBandKey(tier: 1 | 2 | 3): string {
  if (tier === 3) return 'ui.masteryExpert';
  if (tier === 2) return 'ui.masteryIntermediate';
  return 'ui.masteryBeginner';
}

function getTierColor(tier: 1 | 2 | 3): string {
  if (tier === 3) return '#ffcd36'; // gold
  if (tier === 2) return '#dbc3e2'; // purple
  return '#9ed6ea'; // blue
}

export default function PracticePicker({
  currentTiersByPiece,
  onSelectPiece,
  onBack,
}: PracticePickerProps) {
  const t = useTranslations('chessGame');
  const { theme } = useChessPieceTheme();

  return (
    <Box
      sx={{
        py: 2,
        px: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Header row with back button and title */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          maxWidth: 520,
          mb: 2,
        }}
      >
        <IconButton onClick={onBack} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight="bold" sx={{ flex: 1, textAlign: 'center' }}>
          {t('hub.practice' as Parameters<typeof t>[0])}
        </Typography>
        {/* Spacer to center the title */}
        <Box sx={{ width: 40 }} />
      </Box>

      {/* 2x3 piece card grid */}
      <Grid container spacing={2} sx={{ width: '100%', maxWidth: 520 }}>
        {chessPieces.map((piece) => {
          const tier = (currentTiersByPiece[piece.id]?.tier ?? 1) as 1 | 2 | 3;

          return (
            <Grid key={piece.id} size={4}>
              <Card
                data-testid="practice-piece-card"
                sx={{
                  bgcolor: piece.color,
                  borderRadius: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <CardActionArea
                  onClick={() => {
                    playAudio(`chess/he/${piece.audioFile}`);
                    onSelectPiece(piece.id);
                  }}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {/* Piece SVG image */}
                  <img
                    src={`/chess/pieces/${theme}/w${piece.fenChar}.svg`}
                    width={64}
                    height={64}
                    draggable={false}
                    alt=""
                  />

                  {/* Hebrew piece name */}
                  <Typography variant="body1" fontWeight="bold" textAlign="center">
                    {t(piece.translationKey as Parameters<typeof t>[0])}
                  </Typography>

                  {/* Mastery band chip */}
                  <Chip
                    label={t(getBandKey(tier) as Parameters<typeof t>[0])}
                    size="small"
                    sx={{ bgcolor: getTierColor(tier), fontWeight: 'bold', fontSize: '0.7rem' }}
                  />
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
