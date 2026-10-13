import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recuperar Senha',
  description: 'Receba por e-mail um link seguro para redefinir a senha da sua conta LUMIARDI.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RecoverPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
