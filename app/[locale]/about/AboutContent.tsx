'use client';

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
} from '@mui/material';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { getLanguageSpecificRoute } from '@/utils/languageRoutes';
import FunButton from '@/components/FunButton';
import BackButton from '@/components/BackButton';
import letters from '@/data/letters';
import colors from '@/data/colors';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import NoAccountsIcon from '@mui/icons-material/NoAccounts';
import DevicesIcon from '@mui/icons-material/Devices';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HearingIcon from '@mui/icons-material/Hearing';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { ABOUT_LAST_UPDATED } from './constants';

const glassCard = { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' };
const sectionCardStyles = { ...glassCard, borderRadius: '20px', p: { xs: 3, md: 4 } };
const hoverCardStyles = {
  ...glassCard,
  height: '100%',
  borderRadius: '15px',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' },
};
const sectionTitleStyles = { fontSize: { xs: '1.8rem', md: '2.5rem' }, fontWeight: 'bold', color: 'primary.light', mb: 1, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' };
const iconSx = { fontSize: 40, color: 'primary.main' };

const trustStats = ['letters', 'categories', 'games', 'price', 'account'] as const;

// Topic cards link to the real category pages — descriptive anchor text for SEO.
const topics = [
  { id: 'letters', emoji: '🅰️', route: '/letters' },
  { id: 'numbers', emoji: '🔢', route: '/numbers' },
  { id: 'colors', emoji: '🎨', route: '/colors' },
  { id: 'shapes', emoji: '🔶', route: '/shapes' },
  { id: 'animals', emoji: '🐶', route: '/animals' },
  { id: 'food', emoji: '🍎', route: '/food' },
];

const trustItems = [
  { id: 'authentic', icon: <RecordVoiceOverIcon sx={iconSx} /> },
  { id: 'free', icon: <MoneyOffIcon sx={iconSx} /> },
  { id: 'noLogin', icon: <NoAccountsIcon sx={iconSx} /> },
  { id: 'everywhere', icon: <DevicesIcon sx={iconSx} /> },
  { id: 'independent', icon: <ChildCareIcon sx={iconSx} /> },
  { id: 'rewards', icon: <EmojiEventsIcon sx={iconSx} /> },
];

const howSteps = [
  { id: 'listen', icon: <HearingIcon sx={iconSx} /> },
  { id: 'see', icon: <VisibilityIcon sx={iconSx} /> },
  { id: 'play', icon: <SportsEsportsIcon sx={iconSx} /> },
  { id: 'collect', icon: <AutoAwesomeIcon sx={iconSx} /> },
];

const faqIds = ['faq1', 'faq2', 'faq3', 'faq4', 'faq5', 'faq6'];

export default function AboutContent() {
  const t = useTranslations('about');
  const tTopics = useTranslations('seo');
  const tLetters = useTranslations('letters');
  const locale = useLocale();
  const isRTL = locale === 'he';
  const arrow = isRTL ? '←' : '→';

  const updatedDate = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    new Date(ABOUT_LAST_UPDATED)
  );

  const previewLetters = letters.slice(0, 7);
  const previewColors = colors.slice(0, 8);

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <BackButton />

      {/* Hero — story-first, with trust stats */}
      <Box textAlign="center" mt={2} mb={6}>
        <Chip
          label={t('hero.eyebrow')}
          sx={{
            mb: 2,
            fontWeight: 'bold',
            color: 'primary.main',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(6px)',
          }}
        />
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: '2.2rem', md: '3.6rem' },
            fontWeight: 'bold',
            color: 'primary.light',
            mb: 2,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {t('hero.title')}
        </Typography>
        <Typography
          variant="h2"
          component="p"
          sx={{
            fontSize: { xs: '1.1rem', md: '1.5rem' },
            color: 'primary.light',
            mb: 4,
            maxWidth: '760px',
            mx: 'auto',
            lineHeight: 1.6,
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {t('hero.subtitle')}
        </Typography>

        <Box sx={{ display: 'inline-block', mb: 4 }}>
          <FunButton to="/letters" text={t('cta.button')} />
        </Box>

        {/* Trust stats */}
        <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: 900, mx: 'auto' }}>
          {trustStats.map((stat) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={stat}>
              <Card sx={{ ...glassCard, borderRadius: '15px', py: 2, px: 1, textAlign: 'center', height: '100%' }}>
                <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' }, fontWeight: 'bold', color: 'primary.main', lineHeight: 1.2 }}>
                  {t(`trust.${stat}.value`)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                  {t(`trust.${stat}.label`)}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'primary.light', opacity: 0.85 }}>
          {t('hero.updatedLabel')} {updatedDate}
        </Typography>
      </Box>

      {/* Founder story — the page's anchor, moved up front */}
      <Box mb={6}>
        <Card sx={{ ...sectionCardStyles, borderInlineStart: '6px solid #e91e63' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                flexShrink: 0,
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffd1dc, #ff8fab)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.6rem',
                boxShadow: '0 6px 18px rgba(233,30,99,0.3)',
              }}
            >
              👧
            </Box>
            <Box sx={{ textAlign: isRTL ? 'right' : 'left' }}>
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  fontWeight: 'bold',
                  color: '#e91e63',
                  mb: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                }}
              >
                <FavoriteIcon /> {t('founder.title')}
              </Typography>
              <Typography variant="body1" sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.8 }}>
                {t('founder.body')}
              </Typography>
              <Typography sx={{ mt: 2, fontStyle: 'italic', fontWeight: 'bold', color: 'text.secondary' }}>
                {t('founder.signature')}
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Product preview — real letter tiles and color swatches */}
      <Box mb={6}>
        <Typography variant="h3" component="h2" textAlign="center" sx={sectionTitleStyles}>
          {t('preview.title')}
        </Typography>
        <Typography textAlign="center" sx={{ color: 'primary.light', mb: 3, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
          {t('preview.subtitle')}
        </Typography>
        <Card sx={{ ...sectionCardStyles }}>
          <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
            {previewLetters.map((letter) => (
              <Box
                key={letter.id}
                aria-hidden
                sx={{
                  width: { xs: 48, sm: 60 },
                  height: { xs: 48, sm: 60 },
                  borderRadius: '14px',
                  background: letter.color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: { xs: '1.6rem', sm: '2rem' },
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                {tLetters(`${letter.id}.name`)}
              </Box>
            ))}
          </Stack>
          <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap>
            {previewColors.map((c) => (
              <Box
                key={c.id}
                aria-hidden
                sx={{
                  width: { xs: 28, sm: 34 },
                  height: { xs: 28, sm: 34 },
                  borderRadius: '50%',
                  background: c.color,
                  border: '2px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              />
            ))}
          </Stack>
        </Card>
      </Box>

      {/* What your child will explore — internal links to category pages */}
      <Box mb={6}>
        <Typography variant="h3" component="h2" textAlign="center" sx={sectionTitleStyles}>
          {t('learn.title')}
        </Typography>
        <Typography textAlign="center" sx={{ color: 'primary.light', mb: 3, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
          {t('learn.subtitle')}
        </Typography>
        <Grid container spacing={3}>
          {topics.map((topic) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={topic.id}>
              <Link
                href={getLanguageSpecificRoute(topic.route, locale)}
                style={{ textDecoration: 'none', display: 'block', height: '100%' }}
              >
                <Card sx={hoverCardStyles}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography sx={{ fontSize: '3rem', mb: 1 }}>{topic.emoji}</Typography>
                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      {tTopics(`topics.${topic.id}.title`)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {tTopics(`topics.${topic.id}.description`)}
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {t('learn.cardCta')} {arrow}
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Games band */}
      <Box mb={6}>
        <Card sx={{ ...sectionCardStyles, textAlign: 'center' }}>
          <Typography variant="h3" component="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
            {t('games.title')}
          </Typography>
          <Typography variant="body1" sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.8, maxWidth: 720, mx: 'auto', mb: 3 }}>
            {t('games.body')}
          </Typography>
          <Box sx={{ display: 'inline-block' }}>
            <FunButton to="/games" text={t('games.cta')} backgroundColor="#7c4dff" />
          </Box>
        </Card>
      </Box>

      {/* Why parents trust Lepdy */}
      <Box mb={6}>
        <Typography variant="h3" component="h2" textAlign="center" sx={sectionTitleStyles}>
          {t('whyTrust.title')}
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {trustItems.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
              <Card sx={hoverCardStyles}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box mb={2}>{item.icon}</Box>
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {t(`whyTrust.items.${item.id}.title`)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(`whyTrust.items.${item.id}.description`)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* How children learn — honest learning loop */}
      <Box mb={6}>
        <Typography variant="h3" component="h2" textAlign="center" sx={sectionTitleStyles}>
          {t('how.title')}
        </Typography>
        <Card sx={sectionCardStyles}>
          <Typography variant="body1" sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.8, textAlign: 'center', mb: 4, maxWidth: 760, mx: 'auto' }}>
            {t('how.intro')}
          </Typography>
          <Grid container spacing={3}>
            {howSteps.map((step, index) => (
              <Grid size={{ xs: 6, md: 3 }} key={step.id}>
                <Box textAlign="center">
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      mx: 'auto',
                      mb: 1.5,
                      borderRadius: '50%',
                      background: 'rgba(124,77,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {step.icon}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -6,
                        insetInlineEnd: -6,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'primary.main',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {index + 1}
                    </Box>
                  </Box>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {t(`how.steps.${step.id}.title`)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(`how.steps.${step.id}.description`)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Typography sx={{ textAlign: 'center', mt: 4, fontStyle: 'italic', color: 'text.secondary' }}>
            {t('how.note')}
          </Typography>
        </Card>
      </Box>

      {/* FAQ */}
      <Box mb={6}>
        <Typography variant="h3" component="h2" textAlign="center" sx={sectionTitleStyles}>
          {t('faq.title')}
        </Typography>
        <Card sx={{ ...glassCard, borderRadius: '20px', mt: 2 }}>
          {faqIds.map((faq) => (
            <Accordion key={faq} sx={{ background: 'transparent', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                  {t(`faq.${faq}.question`)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                  {t(`faq.${faq}.answer`)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Card>
      </Box>

      {/* Final CTA */}
      <Box textAlign="center" mb={2}>
        <Typography
          variant="h4"
          component="h2"
          sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 'bold', color: 'primary.light', mb: 1, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
        >
          {t('cta.title')}
        </Typography>
        <Typography variant="h6" sx={{ color: 'primary.light', mb: 4, opacity: 0.9 }}>
          {t('cta.subtitle')}
        </Typography>
        <Box sx={{ display: 'inline-block' }}>
          <FunButton to="/letters" text={t('cta.button')} />
        </Box>
      </Box>
    </Container>
  );
}
