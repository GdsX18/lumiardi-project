import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Canal de Denúncias e Proteção de Direitos',
  description:
    'Canal formal de Notice-and-Action e Trust & Safety da LUMIARDI.',
  alternates: {
    canonical: '/portal',
  },
};

export default function DenunciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
