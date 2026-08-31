import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade e Proteção de Dados',
  description:
    'Diretrizes de proteção de dados, privacidade e segurança da plataforma LUMIARDI em conformidade com a LGPD e GDPR.',
  alternates: {
    canonical: '/privacidade',
  },
};

export default function PrivacidadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
