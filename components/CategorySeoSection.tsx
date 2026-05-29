import { getTranslations } from 'next-intl/server';
import { getLocaleUrl } from '@/lib/seo';

// Strips trailing/leading emoji (used in nav button labels) for clean text.
const stripEmoji = (s: string) => s.replace(/\s*[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}️]+\s*/gu, ' ').trim();

interface CategorySeoSectionProps {
  /** Active locale. */
  locale: string;
  /** Localized H2 title key, e.g. "seo.pages.shapes.listTitle". */
  titleKey: string;
  /** Path without locale prefix, e.g. "/shapes". */
  path: string;
  /** Translation key for the breadcrumb name, e.g. "home.buttons.shapes". */
  breadcrumbKey: string;
  /** Translation prefix for items, e.g. "shapes". */
  translationPrefix: string;
  /** Ordered item ids. */
  itemIds: string[];
  /**
   * 'vocab' shows the localized word (plus the Hebrew word on non-Hebrew
   * locales); 'symbol' shows a glyph/digit alongside its spoken name.
   */
  mode: 'vocab' | 'symbol';
}

/**
 * Server-rendered SEO block for category pages: emits BreadcrumbList + ItemList
 * structured data and a crawlable, human-readable list of every item. Both feed
 * search engines and generative engines that need real text, not just tappable
 * cards.
 *
 * Intentionally uses plain HTML elements (no MUI/client components) so the
 * markup — including the JSON-LD <script> tags — is emitted as static
 * server-rendered HTML rather than being serialized into the RSC payload.
 */
export default async function CategorySeoSection({
  locale,
  titleKey,
  path,
  breadcrumbKey,
  translationPrefix,
  itemIds,
  mode,
}: CategorySeoSectionProps) {
  const t = await getTranslations({ locale });
  const tHe = await getTranslations({ locale: 'he' });

  const items = itemIds.map((id) => {
    const base = `${translationPrefix}.${id}`;
    if (mode === 'symbol') {
      return { primary: t(`${base}.name`), secondary: t(`${base}.fullName`) };
    }
    const primary = t(`${base}.name`);
    const secondary = locale === 'he' ? undefined : tHe(`${base}.name`);
    return { primary, secondary };
  });

  const categoryName = stripEmoji(t(breadcrumbKey));
  const title = t(titleKey);
  const pageUrl = getLocaleUrl(locale, path);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Lepdy', item: getLocaleUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: categoryName, item: pageUrl },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    url: pageUrl,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.secondary ? `${it.primary} (${it.secondary})` : it.primary,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <section
        style={{
          textAlign: 'center',
          padding: '0 16px',
          marginTop: 40,
          marginBottom: 8,
          maxWidth: 880,
          marginInline: 'auto',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4a3728', margin: '0 0 12px' }}>
          {title}
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {items.map((it, i) => (
            <span
              key={`${it.primary}-${i}`}
              style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: 999,
                padding: '4px 12px',
                fontSize: '0.95rem',
                color: '#5a4a3a',
                whiteSpace: 'nowrap',
              }}
            >
              {it.secondary ? `${it.primary} · ${it.secondary}` : it.primary}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
