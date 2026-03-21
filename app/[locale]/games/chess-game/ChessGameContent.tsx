'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';
import BackButton from '@/components/BackButton';
import ChessBoardDynamic from '@/components/chess/ChessBoardDynamic';

export default function ChessGameContent() {
  const t = useTranslations('chessGame');

  return (
    <Box sx={{ py: 2, px: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <Box sx={{ width: '100%', maxWidth: 520, mb: 2 }}>
        <BackButton href="/games" />
      </Box>
      <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
        {t('title')}
      </Typography>
      <ChessBoardDynamic />
    </Box>
  );
}
