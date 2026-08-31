import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planos e Preços para Criadoras e Agências',
  description:
    'Conheça os planos Glow, Radiance, Icon, Select e Signature. Infraestrutura completa para criadoras e agências com scouting, drive seguro e blindagem jurídica.',
  alternates: {
    canonical: '/planos',
  },
  openGraph: {
    title: 'Planos e Preços para Criadoras e Agências | LUMIARDI',
    description:
      'Descubra os planos exclusivos da LUMIARDI. Infraestrutura de ponta com drive ilimitado, scouting confidencial e blindagem jurídica.',
    url: '/planos',
  },
};

export default function PlanosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
