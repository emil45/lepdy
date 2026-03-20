'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@mui/material/Button';
import { Box, Typography } from '@mui/material';

interface RoundFunButtonProps {
  to?: string;
  onClick?: () => void;
  backgroundColor?: string;
  children: React.ReactNode;
}

const RoundFunButton: React.FC<RoundFunButtonProps> = (props) => {

  const commonStyles = (theme: any) => ({
    color: 'white',
    height: '50px',
    width: '50px',
    position: 'relative',
    border: 'none',
    background: 'transparent',
    padding: '0',
    cursor: 'pointer',
    outlineOffset: '4px',
    transition: 'filter 250ms',
    minWidth: 0,
    flexShrink: 0,
    '& .shadow': {
      position: 'absolute',
      width: 'inherit',
      height: 'inherit',
      borderRadius: `50%`,
      background: '#00000040',
      willChange: 'transform',
      transform: 'translateY(2px)',
      transition: 'transform 600ms cubic-bezier(.3, .7, .4, 1)',
    },
    '& .edge': {
      position: 'absolute',
      width: 'inherit',
      height: 'inherit',
      borderRadius: `50%`,
      background: 'linear-gradient(to left, #5e1c32 0%, #a82f57 8%, #a82f57 92%, #5e1c32 100%)',
    },
    '& .front': {
      width: 'inherit',
      height: 'inherit',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: `50%`,
      background: props.backgroundColor || '#f74572',
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
      borderRadius: `50%`,
      marginBottom: '2px',
      opacity: 0.6,
    },
    '&& .MuiTouchRipple-rippleVisible': {
      animationDuration: '600ms',
    },
  });

  const button = (
    <Button disableElevation sx={commonStyles} onClick={props.onClick}>
      <Box className="shadow" />
      <Box className="edge" />
      <Typography className="front">{props.children}</Typography>
    </Button>
  );

  if (props.to) {
    return (
      <Link href={props.to} prefetch={true} style={{ textDecoration: 'none' }}>
        {button}
      </Link>
    );
  }

  return button;
};

export default RoundFunButton;
