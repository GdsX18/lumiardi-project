import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumiardi.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
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
        ],
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/_next/',
          '/checkout',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
