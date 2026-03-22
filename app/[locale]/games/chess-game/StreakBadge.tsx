'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/material';
import { useTranslations } from 'next-intl';

const streakBounce = keyframes`
  0%   { transform: scale(1); }
  40%  { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

interface StreakBadgeProps {
  count: number;
}

export default function StreakBadge({ count }: StreakBadgeProps) {
  const t = useTranslations('chessGame.ui');

  // Only render at 2+ consecutive correct — "1 in a row" feels odd
  if (count < 2) return null;

  return (
    // direction: ltr wrapper prevents RTL text reversal
    <Box sx={{ direction: 'ltr', display: 'flex', justifyContent: 'center' }}>
      <Box
        key={count}
        data-testid="streak-badge"
        sx={{
          bgcolor: '#e8f5e9',
          borderRadius: 3,
          px: 2,
          py: 0.5,
          display: 'inline-flex',
          alignItems: 'center',
          animation: `${streakBounce} 0.35s ease-out`,
        }}
      >
        <Typography variant="body1" fontWeight="bold" sx={{ color: '#2e7d32' }}>
          {t('inARow', { count })}
        </Typography>
      </Box>
    </Box>
  );
}
