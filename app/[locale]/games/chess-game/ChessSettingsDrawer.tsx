'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslations } from 'next-intl';
import { useDirection } from '@/hooks/useDirection';
import { type ThemeName } from './pieceThemes';
import { type BoardThemeName, BOARD_THEMES, BOARD_THEME_NAMES } from '@/hooks/useChessBoardTheme';

interface ChessSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  currentTheme: ThemeName;
  onSelectTheme: (name: ThemeName) => void;
  currentBoardTheme: BoardThemeName;
  onSelectBoardTheme: (name: BoardThemeName) => void;
}

const THEMES: ThemeName[] = ['staunty', 'horsey', 'anarcandy', 'pixel', 'shapes', 'xkcd'];

export default function ChessSettingsDrawer({
  open,
  onClose,
  currentTheme,
  onSelectTheme,
  currentBoardTheme,
  onSelectBoardTheme,
}: ChessSettingsDrawerProps) {
  const t = useTranslations('chessGame');
  const direction = useDirection();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor={direction === 'rtl' ? 'left' : 'right'}
      PaperProps={{
        sx: {
          width: 300,
          borderTopRightRadius: direction === 'rtl' ? 13 : undefined,
          borderEndEndRadius: direction === 'rtl' ? 13 : undefined,
          borderTopLeftRadius: direction === 'ltr' ? 13 : undefined,
          borderEndStartRadius: direction === 'ltr' ? 13 : undefined,
          backgroundColor: 'beigePastel',
        },
      }}
      SlideProps={{ direction: direction === 'rtl' ? 'right' : 'left' }}
    >
      <Box
        sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            color="primary.light"
            sx={{ textAlign: direction === 'rtl' ? 'right' : 'left', width: '100%' }}
          >
            {t('settings.pieceTheme')}
          </Typography>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Theme thumbnails */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
          {THEMES.map((name) => {
            const isSelected = name === currentTheme;
            return (
              <Box
                key={name}
                onClick={() => onSelectTheme(name)}
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '12px',
                  border: isSelected ? '3px solid #f0003c' : '2px solid #e0e0e0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  bgcolor: 'background.paper',
                  transition: 'border-color 0.15s',
                  '&:hover': {
                    borderColor: isSelected ? '#f0003c' : '#bdbdbd',
                  },
                }}
              >
                <img
                  src={`/chess/pieces/${name}/wN.svg`}
                  alt={t(`settings.${name}`)}
                  width={60}
                  height={60}
                  style={{ display: 'block' }}
                  draggable={false}
                />
                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.5,
                    fontWeight: isSelected ? 'bold' : 'normal',
                    color: isSelected ? '#f0003c' : 'text.secondary',
                  }}
                >
                  {t(`settings.${name}`)}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Board color theme section */}
        <Typography
          variant="h6"
          color="primary.light"
          sx={{ textAlign: direction === 'rtl' ? 'right' : 'left', width: '100%', mt: 3, mb: 1.5 }}
        >
          {t('settings.boardTheme')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
          {BOARD_THEME_NAMES.map((name) => {
            const isSelected = name === currentBoardTheme;
            const colors = BOARD_THEMES[name];
            return (
              <Box
                key={name}
                onClick={() => onSelectBoardTheme(name)}
                sx={{
                  width: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                {/* Color swatch card */}
                <Box
                  sx={{
                    width: 100,
                    height: 60,
                    borderRadius: '12px',
                    border: isSelected ? '3px solid #f0003c' : '2px solid #e0e0e0',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s',
                    '&:hover': {
                      borderColor: isSelected ? '#f0003c' : '#bdbdbd',
                    },
                  }}
                >
                  {/* Top half: light color */}
                  <Box sx={{ width: '100%', height: '50%', bgcolor: colors.light }} />
                  {/* Bottom half: dark color */}
                  <Box sx={{ width: '100%', height: '50%', bgcolor: colors.dark }} />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.5,
                    fontWeight: isSelected ? 'bold' : 'normal',
                    color: isSelected ? '#f0003c' : 'text.secondary',
                  }}
                >
                  {t(`settings.board_${name}`)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Drawer>
  );
}
