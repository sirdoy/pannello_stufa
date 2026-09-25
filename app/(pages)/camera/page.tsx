import { authSession } from '@/lib/auth/session';
import CameraDashboard from './CameraDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Videocamere - Pannello Stufa',
  description: 'Visualizza e controlla le tue videocamere Netatmo',
};

export default async function CameraPage() {
  const session = await authSession.getSession();

  if (!session || !session.user) {
    const { redirect } = await import('next/navigation');
    redirect('/auth/login');
  }

  return <CameraDashboard />;
}
