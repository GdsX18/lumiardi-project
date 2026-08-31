import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credenciamento de Agências de Gestão',
  description:
    'Credencie sua agência no ecossistema LUMIARDI. Acesse o catálogo de talentos verificados, ferramentas de scouting de elite e gestão protegida.',
  alternates: {
    canonical: '/qualificacao/agencia',
  },
  openGraph: {
    title: 'Credenciamento de Agências de Gestão | LUMIARDI',
    description:
      'Credencie sua agência no ecossistema LUMIARDI e tenha acesso ao radar exclusivo de talentos e scouting.',
    url: '/qualificacao/agencia',
  },
};

export default function AgenciaQualificacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
