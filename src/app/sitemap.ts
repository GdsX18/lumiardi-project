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
    '/portal',
    '/termos-de-uso',
    '/politica-privacidade',
    '/compliance-2257',
    '/termos',
    '/privacidade',
    '/login',
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority:
      route === ''
        ? 1.0
        : route === '/planos' || route === '/qualificacao'
        ? 0.9
        : route === '/portal'
        ? 0.8
        : 0.7,
  }));
}
