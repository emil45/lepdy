import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata } from '@/lib/seo';
import CategoryPage from '@/components/CategoryPage';
import CategorySeoSection from '@/components/CategorySeoSection';
import colors from '@/data/colors';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return generatePageMetadata(locale, 'colors', '/colors');
}

export default async function ColorsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <CategoryPage
        pageName="colors"
        items={colors}
        translationPrefix="colors"
        audioPath="colors"
        renderMode="color"
        category="colors"
      />
      <CategorySeoSection
        locale={locale}
        titleKey="seo.pages.colors.listTitle"
        path="/colors"
        breadcrumbKey="home.buttons.colors"
        translationPrefix="colors"
        itemIds={colors.map((i) => i.id)}
        mode="vocab"
      />
    </>
  );
}
