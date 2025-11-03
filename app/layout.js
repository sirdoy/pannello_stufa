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
    statusBarStyle: 'default',
    title: 'Stufa',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#ef4444',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
      <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Stufa" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="mobile-web-app-capable" content="yes" />
    </head>
    <body className="min-h-screen text-neutral-900 flex flex-col">
    <ClientProviders>
      <VersionEnforcer />
      <Navbar />
      <main className="flex-1 pt-6 pb-12 px-4 sm:px-6 lg:px-8">
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
