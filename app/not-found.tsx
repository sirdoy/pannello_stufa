import Link from 'next/link';
import { Card, Button, EmptyState } from './components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-md p-8">
        <EmptyState
          icon="🔍"
          title="Pagina Non Trovata"
          description="La pagina che stai cercando non esiste o è stata spostata."
          action={
            <Link href="/" className="block w-full">
              <Button variant="ember" className="w-full">
                🏠 Torna alla Home
              </Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}
