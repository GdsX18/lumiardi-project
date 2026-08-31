import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Declaração de Conformidade 18 U.S.C. § 2257',
  description:
    'Declaração formal de conformidade com os requisitos federais de manutenção de registros conforme 18 U.S.C. 2257 e 28 C.F.R. 75.',
  alternates: {
    canonical: '/compliance-2257',
  },
};

export default function Compliance2257Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
