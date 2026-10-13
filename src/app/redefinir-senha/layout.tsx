import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redefinir Senha',
  description: 'Defina uma nova senha de acesso para sua conta LUMIARDI.',
  robots: {
    index: false,
    follow: false,
  },
  // O token de redefinição está na URL: não pode vazar no Referer para outros domínios
  referrer: 'no-referrer',
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
