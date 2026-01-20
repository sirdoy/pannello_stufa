import { auth0 } from '@/lib/auth0';
import CameraDashboard from './CameraDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Videocamere - Pannello Stufa',
  description: 'Visualizza e controlla le tue videocamere Netatmo',
};

export default async function CameraPage() {
  const session = await auth0.getSession();

  if (!session || !session.user) {
    const { redirect } = await import('next/navigation');
    redirect('/auth/login');
  }

  return <CameraDashboard />;
}
