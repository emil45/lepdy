'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslations } from 'next-intl';

interface DailyPuzzleCardProps {
  dateLabel: string;
  isCompleted: boolean;
  onSelect: () => void;
}

export default function DailyPuzzleCard({ dateLabel, isCompleted, onSelect }: DailyPuzzleCardProps) {
  const t = useTranslations('chessGame');

  return (
    <Card
      data-testid="daily-puzzle-card"
      sx={{
        minHeight: 90,
        borderRadius: 3,
        mb: 2,
        opacity: isCompleted ? 0.7 : 1,
        bgcolor: '#ffb74d',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <CardActionArea
        disabled={isCompleted}
        onClick={onSelect}
        sx={{ height: '100%', minHeight: 90 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2, minWidth: 56 }}>
            <Typography sx={{ fontSize: 48, lineHeight: 1 }}>📅</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {t('daily.label')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {isCompleted ? t('daily.comeBackTomorrow') : dateLabel}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            {isCompleted && (
              <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 28 }} />
            )}
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}
