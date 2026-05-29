import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;
const FALLBACK_IMAGE = 'https://www.lepdy.com/og-image.png';

// Cache loaded font subsets across requests, keyed by the requested glyph set.
// Different pages/locales need different glyphs, so we cannot share one subset.
const fontCache = new Map<string, ArrayBuffer>();

/**
 * Loads (and memoizes) a Google font subset containing exactly the glyphs in
 * `text`. Rubik is used because it covers Hebrew, Latin and Cyrillic — all
 * three site locales — in a single family. Subsetting keeps the payload tiny.
 */
async function getFont(text: string): Promise<ArrayBuffer> {
  const cached = fontCache.get(text);
  if (cached) return cached;
  const url = `https://fonts.googleapis.com/css2?family=Rubik:wght@700&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error('Could not parse Google font CSS');
  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) throw new Error(`Font fetch failed: ${fontRes.status}`);
  const buffer = await fontRes.arrayBuffer();
  fontCache.set(text, buffer);
  return buffer;
}

const LTR_CHAR = /[A-Za-z0-9]/;
const LTR_NEUTRAL = /[ .,\-/:()]/;

/**
 * Satori does not implement the Unicode bidi algorithm, so RTL text renders in
 * logical (reversed) order. Our SEO titles contain no combining marks, so we
 * can convert a single logical RTL line to visual order by reversing it and
 * then un-reversing embedded Latin/number runs (e.g. "1-10", "Lepdy") so they
 * stay readable.
 */
function lineToVisualRtl(line: string): string {
  const rev = [...line].reverse();
  const out: string[] = [];
  let i = 0;
  while (i < rev.length) {
    if (LTR_CHAR.test(rev[i])) {
      let j = i + 1;
      while (j < rev.length) {
        if (LTR_CHAR.test(rev[j])) {
          j++;
        } else if (LTR_NEUTRAL.test(rev[j])) {
          // Keep a neutral inside the run only if more LTR follows it.
          let k = j + 1;
          while (k < rev.length && LTR_NEUTRAL.test(rev[k])) k++;
          if (k < rev.length && LTR_CHAR.test(rev[k])) j = k;
          else break;
        } else {
          break;
        }
      }
      out.push(...rev.slice(i, j).reverse());
      i = j;
    } else {
      out.push(rev[i]);
      i++;
    }
  }
  return out.join('');
}

/** Greedily packs words into lines no longer than `maxChars` characters. */
function wrapWords(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) current = word;
    else if (current.length + 1 + word.length <= maxChars) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

/**
 * Converts logical RTL text into an array of visual-order lines. We wrap
 * ourselves (instead of relying on Satori) so that line order stays correct
 * top-to-bottom while each line is independently reordered to visual order.
 */
function toVisualRtlLines(text: string, maxChars: number): string[] {
  return wrapWords(text, maxChars).map(lineToVisualRtl);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = (searchParams.get('title') || 'Lepdy').slice(0, 120);
  const subtitle = (searchParams.get('subtitle') || '').slice(0, 160);

  const isRtl = /[֐-׿؀-ۿ]/.test(title);
  // Pre-order RTL text to visual order (per line) because Satori lacks bidi.
  const titleLines = isRtl ? toVisualRtlLines(title, 24) : [title];
  const subtitleLines = isRtl ? toVisualRtlLines(subtitle, 32) : subtitle ? [subtitle] : [];

  // Load the font (the only network-dependent step) up front so a failure can
  // fall back to the static image. JSX is built outside try/catch because a
  // try/catch cannot catch errors thrown during deferred rendering anyway.
  let font: ArrayBuffer;
  try {
    font = await getFont(`${title}${subtitle}Lepdy lepdy.com 0123456789`);
  } catch {
    return NextResponse.redirect(FALLBACK_IMAGE, 302);
  }

  return new ImageResponse(
    (
      <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '70px',
            background: 'linear-gradient(135deg, #f0d5c8 0%, #e7d1ba 100%)',
            fontFamily: 'Rubik',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 44, color: '#a8704f', fontWeight: 700 }}>
            Lepdy
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
              alignItems: isRtl ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: 68,
                fontWeight: 700,
                color: '#4a3728',
                lineHeight: 1.2,
                textAlign: isRtl ? 'right' : 'left',
                alignItems: isRtl ? 'flex-end' : 'flex-start',
              }}
            >
              {titleLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            {subtitleLines.length ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  fontSize: 34,
                  color: '#6b5640',
                  marginTop: 24,
                  lineHeight: 1.35,
                  textAlign: isRtl ? 'right' : 'left',
                  alignItems: isRtl ? 'flex-end' : 'flex-start',
                }}
              >
                {subtitleLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            ) : null}
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#a8704f' }}>lepdy.com</div>
        </div>
      ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [{ name: 'Rubik', data: font, weight: 700, style: 'normal' }],
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
      },
    }
  );
}
