import { Box, Typography } from '@mui/material';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import FunButton from '@/components/FunButton';
import HomeHeader from '@/components/HomeHeader';
import StartHere from '@/components/StartHere';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <Box>
      <Typography
        component="h1"
        sx={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {t('seo.hero.title')}
      </Typography>
      <HomeHeader locale={locale} />
      <StartHere />
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{ pt: 2 }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <FunButton to="/letters" text={t('home.buttons.letters')} />
          <FunButton to="/numbers" text={t('home.buttons.numbers')} />
          <FunButton to="/colors" text={t('home.buttons.colors')} />
          <FunButton to="/shapes" text={t('home.buttons.shapes')} />
          <FunButton to="/animals" text={t('home.buttons.animals')} />
          <FunButton to="/food" text={t('home.buttons.food')} />
          <FunButton to="/games" text={t('home.buttons.games')} />
        </Box>
      </Box>
    </Box>
  );
}
