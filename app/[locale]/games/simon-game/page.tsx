import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import SimonGameContent from './SimonGameContent';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'simonGame', '/games/simon-game');
}

export default async function SimonGamePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SimonGameContent />;
}
