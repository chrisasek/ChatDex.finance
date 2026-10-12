import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChatDex — Finance from conversation to confirmation',
  description: 'Ask, prepare, review, and confirm a clearly labelled paper trade across WhatsApp and ChatDex.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/chatdex-icon.svg' }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
