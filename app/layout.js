import './globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Pannello Stufa',
  description: 'Controllo remoto della stufa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
    <head>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#ef4444" />
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body className="min-h-screen text-neutral-900">
    <Navbar />
    <main className="pt-6 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
    </body>
    </html>
  );
}
