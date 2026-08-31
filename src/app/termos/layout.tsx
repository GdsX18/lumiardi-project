import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos e Condições de Uso',
  description:
    'Termos e condições gerais de uso da plataforma LUMIARDI. Regras, conformidade e acordos contratuais de confidencialidade.',
  alternates: {
    canonical: '/termos',
  },
};

export default function TermosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
