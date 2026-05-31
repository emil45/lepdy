import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.lepdy.com';

type ChangeFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

type Route = {
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
};

const routes: Route[] = [
  // Homepage
  { path: '', priority: 1.0, changeFrequency: 'weekly' },

  // Content / SEO landing pages (updated periodically)
  { path: '/about', priority: 0.95, changeFrequency: 'weekly' },
  { path: '/learn', priority: 0.9, changeFrequency: 'weekly' },

  // Learning Categories (stable content - changes rarely)
  { path: '/letters', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/numbers', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/colors', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/shapes', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/animals', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/food', priority: 0.8, changeFrequency: 'monthly' },

  // Games
  { path: '/games', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/games/word-builder', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/games/guess-game', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/games/memory-match-game', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/games/simon-game', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/games/speed-challenge', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/games/letter-rain', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/games/sound-matching', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/games/counting-game', priority: 0.6, changeFrequency: 'monthly' },
  // letter-tracing disabled - needs proper implementation

  // Other
  { path: '/stickers', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/my-words', priority: 0.6, changeFrequency: 'monthly' },

  // Info Pages
  { path: '/safety', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.4, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: {
        he: `${BASE_URL}${route.path}`,
        en: `${BASE_URL}/en${route.path}`,
        ru: `${BASE_URL}/ru${route.path}`,
        // x-default points to the Hebrew (default-locale) URL for users
        // outside our three targeted languages.
        'x-default': `${BASE_URL}${route.path}`,
      },
    },
  }));
}
