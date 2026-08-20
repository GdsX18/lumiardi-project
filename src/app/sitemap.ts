import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumiardi.com';
  const now = new Date();

  const publicRoutes = [
    '',
    '/planos',
    '/qualificacao',
    '/qualificacao/agencia',
    '/qualificacao/limites',
    '/login',
    '/termos',
    '/privacidade',
    '/compliance-2257',
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/planos' || route === '/qualificacao' ? 0.9 : 0.7,
  }));
}
