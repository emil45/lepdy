import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import CountingGameContent from './CountingGameContent';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'countingGame', '/games/counting-game');
}

export default async function CountingGamePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CountingGameContent />;
}
