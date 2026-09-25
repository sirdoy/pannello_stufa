import { authSession } from '@/lib/auth/session';
import CameraEventsPage from './CameraEventsPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Eventi Camera - Pannello Stufa',
  description: 'Visualizza tutti gli eventi registrati dalle videocamere Netatmo',
};

export default async function EventsPage() {
  const session = await authSession.getSession();

  if (!session || !session.user) {
    const { redirect } = await import('next/navigation');
    redirect('/auth/login');
  }

  return <CameraEventsPage />;
}
