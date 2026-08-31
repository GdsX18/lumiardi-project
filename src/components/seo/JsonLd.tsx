import React from 'react';

export function JsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumiardi.com';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LUMIARDI Technologies',
    alternateName: 'LUMIARDI',
    url: baseUrl,
    logo: `${baseUrl}/LUMIARDI%20-%20Logo%20Combinada%20trasparente.png`,
    description:
      'Ecossistema exclusivo de tecnologia e curadoria que conecta criadoras de conteúdo premium a agências de gestão e assessoria de elite.',
    sameAs: [
      'https://instagram.com/lumiardi',
      'https://twitter.com/lumiardi',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contato@lumiardi.com',
      contactType: 'customer support',
      availableLanguage: ['Portuguese', 'English', 'Spanish', 'French'],
    },
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LUMIARDI',
    url: baseUrl,
    description:
      'Plataforma global e exclusiva de conexão, gestão e blindagem jurídica para criadoras premium e agências.',
    inLanguage: ['pt-BR', 'en', 'es', 'fr'],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
    </>
  );
}
