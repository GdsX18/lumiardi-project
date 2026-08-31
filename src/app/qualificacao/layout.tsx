import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Candidatura e Qualificação de Criadoras',
  description:
    'Candidate-se ao ecossistema exclusivo LUMIARDI. Conexão direta com as maiores agências de gestão e assessoria do mercado com total confidencialidade.',
  alternates: {
    canonical: '/qualificacao',
  },
  openGraph: {
    title: 'Candidatura e Qualificação de Criadoras | LUMIARDI',
    description:
      'Submeta sua candidatura para o casting oficial da LUMIARDI e receba propostas de agências verificadas.',
    url: '/qualificacao',
  },
};

export default function QualificacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
