import Link from 'next/link';
import Card from './components/ui/Card';
import Button from './components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card glass className="max-w-md w-full p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Pagina Non Trovata</h1>
        <p className="text-gray-600 mb-6">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <Link href="/">
          <Button variant="primary" className="w-full">
            🏠 Torna alla Home
          </Button>
        </Link>
      </Card>
    </div>
  );
}
