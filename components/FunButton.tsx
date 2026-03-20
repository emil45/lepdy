'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@mui/material/Button';
import { Box, Typography } from '@mui/material';
import { useLocale } from 'next-intl';
import { getLanguageSpecificRoute } from '@/utils/languageRoutes';
import { logEvent } from '@/utils/amplitude';
import { AmplitudeEventsEnum } from '@/models/amplitudeEvents';

interface FunButtonProps {
  text: string;
  to?: string;
  onClick?: () => void;
  fontSize?: number;
  backgroundColor?: string;
  paddingX?: number;
}

function darkenColor(hex: string, factor: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.round(((num >> 16) & 0xFF) * factor);
  const g = Math.round(((num >> 8) & 0xFF) * factor);
  const b = Math.round((num & 0xFF) * factor);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const FunButton: React.FC<FunButtonProps> = ({
  text,
  to,
  onClick,
  fontSize,
  backgroundColor,
  paddingX,
  ...rest
}) => {
  const locale = useLocale();
  const bg = backgroundColor || '#f74572';
  const edgeMid = darkenColor(bg, 0.68);
  const edgeDark = darkenColor(bg, 0.38);

  const commonStyles = (theme: any) => ({
    width: '100%',
    position: 'relative',
    border: 'none',
    background: 'transparent',
    padding: '0',
    cursor: 'pointer',
    outlineOffset: '4px',
    transition: 'filter 250ms',
    '& .shadow': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '12px',
      background: '#00000040',
      willChange: 'transform',
      transform: 'translateY(2px)',
      transition: 'transform 600ms cubic-bezier(.3, .7, .4, 1)',
    },
    '& .edge': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '12px',
      background: `linear-gradient(to left, ${edgeDark} 0%, ${edgeMid} 8%, ${edgeMid} 92%, ${edgeDark} 100%)`,
    },
    '& .front': {
      display: 'block',
      position: 'relative',
      color: theme.palette.colors.white,
      fontWeight: 'bold',
      fontSize: fontSize ? `${fontSize}px` : { xs: '24px', sm: '30px', md: '40px' },
      padding: `12px ${paddingX || 30}px`,
      borderRadius: '12px',
      background: bg,
      willChange: 'transform',
      transform: 'translateY(-4px)',
      transition: 'transform 600ms cubic-bezier(.3, .7, .4, 1)',
    },
    '&:hover': {
      backgroundColor: 'transparent',
      filter: 'brightness(110%)',
      '& .front': {
        transform: 'translateY(-6px)',
        transition: 'transform 250ms cubic-bezier(.3, .7, .4, 1.5)',
      },
      '& .shadow': {
        transform: 'translateY(4px)',
        transition: 'transform 250ms cubic-bezier(.3, .7, .4, 1.5)',
      },
    },
    '&:active': {
      '& .front': {
        transform: 'translateY(-2px)',
        transition: 'transform 34ms',
      },
      '& .shadow': {
        transform: 'translateY(1px)',
        transition: 'transform 34ms',
      },
    },
    '&:focus:not(:focus-visible)': {
      outline: 'none',
    },
    '& .MuiTouchRipple-root': {
      color: 'red',
      borderRadius: '10px',
      marginBottom: '2px',
      opacity: 0.6,
    },
    '&& .MuiTouchRipple-rippleVisible': {
      animationDuration: '600ms',
    },
  });

  const handleClick = () => {
    logEvent(AmplitudeEventsEnum.BUTTON_CLICK, { button_name: text });
    onClick?.();
  };

  const button = (
    <Button disableElevation sx={commonStyles} onClick={handleClick} {...rest}>
      <Box className="shadow" />
      <Box className="edge" />
      <Typography className="front" sx={{ minWidth: '100%' }}>
        {text}
      </Typography>
    </Button>
  );

  if (to) {
    const href = getLanguageSpecificRoute(to, locale);
    return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{button}</Link>;
  }

  return button;
};

export default FunButton;
