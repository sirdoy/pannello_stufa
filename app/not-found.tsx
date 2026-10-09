import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Card, Button, EmptyState } from './components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-md p-8">
        <EmptyState
          icon={<Search size={48} className="text-(--text-2)" />}
          title="Pagina Non Trovata"
          description="La pagina che stai cercando non esiste o è stata spostata."
          action={
            <Link href="/" className="block w-full">
              <Button variant="ember" className="w-full" icon={<Home size={18} />}>
                Torna alla Home
              </Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}
