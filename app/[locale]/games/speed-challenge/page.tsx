import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import SpeedChallengeContent from './SpeedChallengeContent';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'speedChallenge', '/games/speed-challenge');
}

export default async function SpeedChallengePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SpeedChallengeContent />;
}
