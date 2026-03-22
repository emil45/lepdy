export type ChessPieceId = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export interface ChessPieceConfig {
  id: ChessPieceId;
  translationKey: string;
  audioFile: string;
  audioPath: string;
  symbol: string;
  emoji: string;
  fenChar: string;
  color: string;
  order: number;
}

export const chessPieces: ChessPieceConfig[] = [
  {
    id: 'king',
    translationKey: 'pieces.king',
    audioFile: 'melech.mp3',
    audioPath: '/audio/chess/he/melech.mp3',
    symbol: '\u2654',
    emoji: '\u265A',
    fenChar: 'K',
    color: '#FFD700',
    order: 1,
  },
  {
    id: 'rook',
    translationKey: 'pieces.rook',
    audioFile: 'tzariach.mp3',
    audioPath: '/audio/chess/he/tzariach.mp3',
    symbol: '\u2656',
    emoji: '\u265C',
    fenChar: 'R',
    color: '#87CEEB',
    order: 2,
  },
  {
    id: 'bishop',
    translationKey: 'pieces.bishop',
    audioFile: 'ratz.mp3',
    audioPath: '/audio/chess/he/ratz.mp3',
    symbol: '\u2657',
    emoji: '\u265D',
    fenChar: 'B',
    color: '#DDA0DD',
    order: 3,
  },
  {
    id: 'queen',
    translationKey: 'pieces.queen',
    audioFile: 'malka.mp3',
    audioPath: '/audio/chess/he/malka.mp3',
    symbol: '\u2655',
    emoji: '\u265B',
    fenChar: 'Q',
    color: '#FF69B4',
    order: 4,
  },
  {
    id: 'knight',
    translationKey: 'pieces.knight',
    audioFile: 'parash.mp3',
    audioPath: '/audio/chess/he/parash.mp3',
    symbol: '\u2658',
    emoji: '\u265E',
    fenChar: 'N',
    color: '#98FB98',
    order: 5,
  },
  {
    id: 'pawn',
    translationKey: 'pieces.pawn',
    audioFile: 'chayal.mp3',
    audioPath: '/audio/chess/he/chayal.mp3',
    symbol: '\u2659',
    emoji: '\u265F',
    fenChar: 'P',
    color: '#F0E68C',
    order: 6,
  },
];
