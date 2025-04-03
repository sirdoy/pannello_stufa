import { getSession } from '@auth0/nextjs-auth0/edge';
import StovePanel from './components/StovePanel'; // senza dynamic

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();
  const user = session?.user;

  return (
    <main>
      <StovePanel />
    </main>
  );
}
