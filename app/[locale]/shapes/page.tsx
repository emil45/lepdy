import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import CategoryPage from '@/components/CategoryPage';
import CategorySeoSection from '@/components/CategorySeoSection';
import shapes from '@/data/shapes';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'shapes', '/shapes');
}

export default async function ShapesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <CategoryPage
        pageName="shapes"
        items={shapes}
        translationPrefix="shapes"
        audioPath="shapes"
        renderMode="element"
        category="shapes"
      />
      <CategorySeoSection
        locale={locale}
        titleKey="seo.pages.shapes.listTitle"
        path="/shapes"
        breadcrumbKey="home.buttons.shapes"
        translationPrefix="shapes"
        itemIds={shapes.map((i) => i.id)}
        mode="vocab"
      />
    </>
  );
}
