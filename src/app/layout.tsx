import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "LUMIARDI — Ecossistema Premium",
  description: "Plataforma global e exclusiva de tecnologia que conecta criadores premium a agências de gestão de elite.",
  icons: {
    icon: "/Lumiardi logo2-Trasparente.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${cormorant.variable} ${outfit.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-black-matte text-ivory font-sans overflow-x-hidden"
      >
        <ScrollProgressBar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
