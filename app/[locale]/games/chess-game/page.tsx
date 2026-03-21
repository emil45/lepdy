import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import ChessGameContent from './ChessGameContent';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'chessGame', '/games/chess-game');
}

export default async function ChessGamePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ChessGameContent />;
}
