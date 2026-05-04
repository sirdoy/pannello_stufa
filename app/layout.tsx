import type { Metadata, Viewport } from 'next';
import './globals.css';
import { outfit, inter } from './fonts';
import { WebVitals } from './_components/WebVitals';
import ClientProviders from './components/ClientProviders';
import VersionEnforcer from './components/VersionEnforcer';
import AppleSplashScreens from './components/AppleSplashScreens';
import AmbientBg from './components/EmberGlass/AmbientBg';
import { BottomTabBar } from './components/EmberGlass';
import { NavbarConnectionStatusChip } from './components/layout/NavbarConnectionStatusChip';

export const metadata: Metadata = {
  title: 'Pannello Stufa',
  description: 'Controllo remoto della stufa Thermorossi con pianificazione automatica e monitoraggio temperatura',
  applicationName: 'Pannello Stufa',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stufa',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" data-scroll-behavior="smooth" className={`${outfit.variable} ${inter.variable} dark`} suppressHydrationWarning>
    <head>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var a=localStorage.getItem('ember-glass-accent');var amb=localStorage.getItem('ember-glass-ambient');if(a){document.documentElement.style.setProperty('--accent',a);}if(amb==='true'){document.documentElement.dataset.ambient='on';}}catch(e){}})();`
        }}
      />
      <meta name="view-transition" content="same-origin" />
      {/* Preconnect: critical API domains */}
      <link rel="preconnect" href="https://pannellostufa-default-rtdb.europe-west1.firebasedatabase.app" />
      <link rel="preconnect" href="https://pannellostufa.firebaseapp.com" />
      <link rel="preconnect" href="https://pannellostufa.eu.auth0.com" />
      <AppleSplashScreens />
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
      <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Stufa" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#0f172a" />
    </head>
    <body className="min-h-screen bg-slate-900 text-slate-100 flex flex-col" suppressHydrationWarning>
    <AmbientBg />
    {/* Skip to content - Accessibility */}
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[10000] px-6 py-3 bg-ember-500 text-white rounded-xl shadow-liquid-lg font-semibold hover:bg-ember-600 transition-colors"
    >
      Salta al contenuto
    </a>

    <ClientProviders>
      <WebVitals />
      <VersionEnforcer />
      <NavbarConnectionStatusChip />
      <main
        id="main-content"
        className="flex-1 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+88px)] px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </ClientProviders>
    {/* Rendered outside ClientProviders so SplashGate's transform wrapper
        doesn't become its containing block (which would re-anchor
        position:fixed to the wrapper height instead of the viewport). */}
    <BottomTabBar />
    </body>
    </html>
  );
}
