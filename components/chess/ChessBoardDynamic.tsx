'use client';

import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';

const ChessBoardLazy = dynamic(() => import('./ChessBoard'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        width: '100%',
        maxWidth: 480,
        aspectRatio: '1 / 1',
        backgroundColor: 'grey.200',
        borderRadius: 2,
        margin: '0 auto',
      }}
    />
  ),
});

export default ChessBoardLazy;
