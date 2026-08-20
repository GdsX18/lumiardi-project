import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LUMIARDI — Ecossistema Exclusivo de Criadoras e Agências',
    short_name: 'LUMIARDI',
    description: 'Plataforma global e exclusiva de tecnologia que conecta criadores premium a agências de gestão de elite.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0B0B',
    theme_color: '#C9A96B',
    icons: [
      {
        src: '/Lumiardi logo2-Trasparente.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
