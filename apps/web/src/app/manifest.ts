import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ChatDex', short_name: 'ChatDex',
    description: 'Financial intent, from conversation to execution.',
    start_url: '/app', display: 'standalone', background_color: '#efece6', theme_color: '#ff8a3d',
    icons: [{ src: '/chatdex-icon.svg', sizes: 'any', type: 'image/svg+xml' }]
  };
}
