import './globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Pannello Stufa',
  description: 'Controllo remoto della stufa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
    <body className="bg-gray-100 text-black min-h-screen">
    <Navbar />
    <main className="pt-4 px-4">{children}</main>
    </body>
    </html>
  );
}
