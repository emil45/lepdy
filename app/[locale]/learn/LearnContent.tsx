'use client';

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import FunButton from '@/components/FunButton';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const glassCard = {
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
};

const linkCardStyles = {
  ...glassCard,
  height: '100%',
  borderRadius: '15px',
  textDecoration: 'none',
  display: 'block',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' },
};

const sectionCardStyles = { ...glassCard, borderRadius: '20px', p: 4 };

const sectionTitleStyles = {
  fontSize: { xs: '1.8rem', md: '2.5rem' },
  fontWeight: 'bold',
  color: 'primary.light',
  mb: 4,
  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
};

// Each learning step links to the matching category/games route.
const steps = [
  { id: 'step1', to: '/letters', emoji: '🔤' },
  { id: 'step2', to: '/numbers', emoji: '🔢' },
  { id: 'step3', to: '/colors', emoji: '🎨' },
  { id: 'step4', to: '/games', emoji: '🎮' },
];

// Full internal-linking hub to every learning category.
const topics = [
  { id: 'letters', to: '/letters', emoji: '🅰️' },
  { id: 'numbers', to: '/numbers', emoji: '🔢' },
  { id: 'colors', to: '/colors', emoji: '🎨' },
  { id: 'shapes', to: '/shapes', emoji: '🔶' },
  { id: 'animals', to: '/animals', emoji: '🐶' },
  { id: 'food', to: '/food', emoji: '🍎' },
];

const tips = ['tip1', 'tip2', 'tip3'];

export default function LearnContent() {
  const t = useTranslations('learnPage');
  const tSeo = useTranslations('seo');
  const locale = useLocale();
  const isRTL = locale === 'he';

  const getPath = (path: string) => (locale === 'he' ? path : `/${locale}${path}`);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero */}
      <Box textAlign="center" mb={6}>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: '2.2rem', md: '3.5rem' },
            fontWeight: 'bold',
            color: 'primary.light',
            mb: 3,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {t('heading')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: '1rem', md: '1.2rem' },
            color: 'text.primary',
            maxWidth: '820px',
            mx: 'auto',
            lineHeight: 1.8,
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '15px',
            p: 3,
          }}
        >
          {t('intro')}
        </Typography>
      </Box>

      {/* Steps - where to start */}
      <Box mb={6}>
        <Typography variant="h2" component="h2" textAlign="center" sx={sectionTitleStyles}>
          {t('stepsTitle')}
        </Typography>
        <Grid container spacing={3}>
          {steps.map((step, index) => (
            <Grid size={{ xs: 12, sm: 6 }} key={step.id}>
              <Card component={Link} href={getPath(step.to)} sx={linkCardStyles}>
                <CardContent sx={{ p: 3, textAlign: isRTL ? 'right' : 'left' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Typography sx={{ fontSize: '2.5rem' }}>{step.emoji}</Typography>
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{ fontWeight: 'bold', color: 'primary.main' }}
                    >
                      {index + 1}. {t(`${step.id}Title`)}
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {t(`${step.id}Text`)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Topics hub - links to every category */}
      <Box mb={6}>
        <Typography variant="h2" component="h2" textAlign="center" sx={sectionTitleStyles}>
          {t('topicsTitle')}
        </Typography>
        <Grid container spacing={3}>
          {topics.map((topic) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={topic.id}>
              <Card component={Link} href={getPath(topic.to)} sx={linkCardStyles}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography sx={{ fontSize: '3rem', mb: 1 }}>{topic.emoji}</Typography>
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
                  >
                    {tSeo(`topics.${topic.id}.title`)}
                    <ArrowForwardIcon sx={{ fontSize: '1rem', transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tSeo(`topics.${topic.id}.description`)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Tips for parents */}
      <Box mb={6}>
        <Card sx={sectionCardStyles}>
          <Typography
            variant="h2"
            component="h2"
            textAlign="center"
            sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, fontWeight: 'bold', color: 'primary.main', mb: 3 }}
          >
            {t('tipsTitle')}
          </Typography>
          <List>
            {tips.map((tip) => (
              <ListItem key={tip} sx={{ pl: 0 }}>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                </ListItemIcon>
                <ListItemText
                  primary={t(tip)}
                  sx={{ textAlign: isRTL ? 'right' : 'left' }}
                  primaryTypographyProps={{ sx: { fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.7 } }}
                />
              </ListItem>
            ))}
          </List>
        </Card>
      </Box>

      {/* Final CTA */}
      <Box textAlign="center">
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontWeight: 'bold',
            color: 'primary.light',
            mb: 3,
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {t('ctaTitle')}
        </Typography>
        <Box sx={{ display: 'inline-block' }}>
          <FunButton to="/" text={t('ctaButton')} />
        </Box>
      </Box>
    </Container>
  );
}
