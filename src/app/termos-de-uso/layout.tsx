import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso da Plataforma',
  description:
    'Termos de Uso oficiais da Plataforma LUMIARDI (18+). Regras gerais, moderação, responsabilidade, proteção de direitos e diretrizes contratuais.',
  alternates: {
    canonical: '/termos-de-uso',
  },
  openGraph: {
    title: 'Termos de Uso da Plataforma | LUMIARDI',
    description:
      'Termos de Uso oficiais da Plataforma LUMIARDI. Ambiente exclusivo 18+ com diretrizes de conduta, segurança e proteção jurídica.',
    url: '/termos-de-uso',
  },
};

export default function TermosDeUsoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
