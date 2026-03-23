'use client';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslations } from 'next-intl';

type ChessView = 'hub' | 'level-1' | 'session' | 'daily' | 'practice-picker';

interface HubTile {
  id: string;
  emoji: string;
  labelKey: string;
  color: string;
  view: ChessView;
}

const HUB_TILES: HubTile[] = [
  { id: 'learn', emoji: '\u2654', labelKey: 'hub.learn', color: '#9ed6ea', view: 'level-1' },
  { id: 'challenge', emoji: '\u2656', labelKey: 'hub.challenge', color: '#dbc3e2', view: 'session' },
  { id: 'practice', emoji: '\u265E', labelKey: 'hub.practice', color: '#dee581', view: 'practice-picker' },
  { id: 'daily', emoji: '\uD83D\uDCC5', labelKey: 'hub.daily', color: '#ffcd36', view: 'daily' },
];

interface ChessHubMenuProps {
  onNavigate: (view: ChessView) => void;
  isDailyCompleted: boolean;
}

export default function ChessHubMenu({ onNavigate, isDailyCompleted }: ChessHubMenuProps) {
  const t = useTranslations('chessGame');

  return (
    <Grid container spacing={2} sx={{ width: '100%', maxWidth: 520 }}>
      {HUB_TILES.map((tile) => (
        <Grid key={tile.id} size={6}>
          <Card
            data-testid="hub-tile"
            sx={{
              bgcolor: tile.color,
              borderRadius: 3,
              minHeight: 140,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <CardActionArea
              onClick={() => onNavigate(tile.view)}
              sx={{
                minHeight: 140,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <Typography sx={{ fontSize: 56, lineHeight: 1 }}>{tile.emoji}</Typography>
              <Typography variant="h6" fontWeight="bold" textAlign="center">
                {t(tile.labelKey as Parameters<typeof t>[0])}
              </Typography>
              {tile.id === 'daily' && isDailyCompleted && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 28 }} />
                </Box>
              )}
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
