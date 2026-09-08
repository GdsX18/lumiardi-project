import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export default function ContatoLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-ivory font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />
      {children}
      <Footer />
    </main>
  );
}

