import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";
import { JsonLd } from "@/components/seo/JsonLd";

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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lumiardi.com";

export const viewport: Viewport = {
  themeColor: "#C9A96B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "LUMIARDI — Ecossistema Exclusivo de Criadoras e Agências de Elite",
    template: "%s | LUMIARDI",
  },
  description:
    "Plataforma global e exclusiva de tecnologia e curadoria que conecta criadoras premium a agências de gestão de elite. Scouting confidencial, blindagem jurídica e gestão de talentos.",
  applicationName: "LUMIARDI",
  authors: [{ name: "LUMIARDI Technologies", url: baseUrl }],
  creator: "LUMIARDI",
  publisher: "LUMIARDI",
  category: "technology",
  keywords: [
    "LUMIARDI",
    "gestão de criadoras",
    "agência de criadores",
    "scouting de modelos",
    "assessoria OnlyFans",
    "assessoria Privacy",
    "gestão de talentos digitais",
    "blindagem jurídica criadores",
    "plataforma de criadoras premium",
    "casting digital",
    "drive seguro modelos",
  ],
  alternates: {
    canonical: "/",
    languages: {
      "pt-BR": "/",
      "en-US": "/?lang=en",
      "es-ES": "/?lang=es",
      "fr-FR": "/?lang=fr",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "LUMIARDI — Ecossistema Exclusivo de Criadoras e Agências de Elite",
    description:
      "Plataforma global e confidencial que conecta criadoras premium a agências de gestão e assessoria de elite.",
    url: baseUrl,
    siteName: "LUMIARDI",
    images: [
      {
        url: "/assets/images/hero_visual.jpg",
        width: 1200,
        height: 630,
        alt: "LUMIARDI — Ecossistema Exclusivo de Criadoras e Agências",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LUMIARDI — Ecossistema Exclusivo de Criadoras e Agências de Elite",
    description:
      "Plataforma global e confidencial que conecta criadoras premium a agências de gestão e assessoria de elite.",
    images: ["/assets/images/hero_visual.jpg"],
    creator: "@lumiardi",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cormorant.variable} ${outfit.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-black-matte text-ivory font-sans overflow-x-hidden"
      >
        <JsonLd />
        <ScrollProgressBar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
