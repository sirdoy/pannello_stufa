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
      <meta name="theme-color" content="#1e40af" />
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body className="bg-gray-100 text-black min-h-screen">
    <Navbar />
    <main className="pt-4 px-4">{children}</main>
    </body>
    </html>
  );
}
