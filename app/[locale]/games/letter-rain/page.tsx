import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import LetterRainContent from './LetterRainContent';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'letterRain', '/games/letter-rain');
}

export default async function LetterRainPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LetterRainContent />;
}
