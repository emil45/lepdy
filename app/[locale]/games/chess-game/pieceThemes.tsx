'use client';

// PieceRenderObject matches the react-chessboard pieces option type
type PieceRenderObject = Record<string, (props?: {
  fill?: string;
  square?: string;
  svgStyle?: React.CSSProperties;
}) => React.JSX.Element>;

export type ThemeName = 'staunty' | 'horsey';

export const PIECE_CODES = [
  'wK', 'wQ', 'wR', 'wB', 'wN', 'wP',
  'bK', 'bQ', 'bR', 'bB', 'bN', 'bP',
] as const;

function buildPieceRenderObject(theme: string): PieceRenderObject {
  const obj: PieceRenderObject = {};
  for (const code of PIECE_CODES) {
    obj[code] = () => (
      <img
        src={`/chess/pieces/${theme}/${code}.svg`}
        alt={code}
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        draggable={false}
      />
    );
  }
  return obj;
}

export const pieceThemes: Record<ThemeName, PieceRenderObject> = {
  staunty: buildPieceRenderObject('staunty'),
  // horsey theme will be added in plan 02
  horsey: buildPieceRenderObject('horsey'),
};
