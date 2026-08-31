import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login Seguro',
  description:
    'Acesse sua conta LUMIARDI. Painel exclusivo para criadoras verificadas e agências credenciadas.',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
