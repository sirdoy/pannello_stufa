import { Outfit, Space_Grotesk } from 'next/font/google';

export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});
