import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal de Denúncias, Abuso e Proteção de Direitos',
  description:
    'Canal formal de Notice-and-Action e Trust & Safety da LUMIARDI. Reporte conteúdos ilegais, violações de direitos autorais, imagem, menores (ECA Digital) e fraudes.',
  alternates: {
    canonical: '/portal',
  },
  openGraph: {
    title: 'Portal de Denúncias, Abuso e Direitos | LUMIARDI',
    description:
      'Canal oficial da LUMIARDI para comunicação de infrações, proteção de direitos de imagem, notice-and-action e conformidade regulatória.',
    url: '/portal',
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
