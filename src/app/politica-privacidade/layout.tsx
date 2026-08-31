import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade e LGPD',
  description:
    'Política de Privacidade e Proteção de Dados (LGPD) oficial da LUMIARDI GESTÃO DE CONTEÚDO LTDA. Diretrizes de tratamento, segurança, cookies e direitos dos titulares.',
  alternates: {
    canonical: '/politica-privacidade',
  },
  openGraph: {
    title: 'Política de Privacidade e LGPD | LUMIARDI',
    description:
      'Política de Privacidade oficial da LUMIARDI em conformidade integral com a LGPD (Lei nº 13.709/2018) e regulamentações da ANPD.',
    url: '/politica-privacidade',
  },
};

export default function PoliticaPrivacidadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
