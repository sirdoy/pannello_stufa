import './globals.css';
import Navbar from './components/Navbar';
import { Footer } from './components/ui';
import ClientProviders from './components/ClientProviders';
import VersionEnforcer from './components/VersionEnforcer';

export const metadata = {
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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="it" suppressHydrationWarning>
    <head>
      <meta name="view-transition" content="same-origin" />
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
      <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Stufa" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="mobile-web-app-capable" content="yes" />

      {/* Theme script - blocking per evitare flash */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              const isDark = localStorage.getItem('pannello-stufa-theme') === 'dark';
              if (isDark) {
                document.documentElement.classList.add('dark');
              }
              // Update theme-color based on theme
              const themeColor = isDark ? '#0f172a' : '#f8fafc';
              const metaThemeColor = document.querySelector('meta[name="theme-color"]');
              if (metaThemeColor) {
                metaThemeColor.setAttribute('content', themeColor);
              } else {
                const meta = document.createElement('meta');
                meta.name = 'theme-color';
                meta.content = themeColor;
                document.head.appendChild(meta);
              }
            } catch (e) {}
          `,
        }}
      />
    </head>
    <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col" suppressHydrationWarning>
    {/* Skip to content - Accessibility */}
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[10000] px-6 py-3 bg-ember-500 text-white rounded-xl shadow-liquid-lg font-semibold hover:bg-ember-600 transition-colors"
    >
      Salta al contenuto
    </a>

    <ClientProviders>
      <VersionEnforcer />
      <Navbar />
      <main id="main-content" className="flex-1 pt-2 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Footer />
    </ClientProviders>
    </body>
    </html>
  );
}
