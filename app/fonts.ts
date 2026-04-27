import { Outfit, Inter } from 'next/font/google';

export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display-outfit',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body-inter',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});
