import Link from 'next/link';
import { getSession } from '@auth0/nextjs-auth0/edge';

export default async function Navbar() {
  const session = await getSession();
  const user = session?.user;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-lg font-semibold text-gray-800 hover:text-black">
        🔥 Pannello Stufa
      </Link>

      <div className="flex items-center space-x-4 text-sm">
        {user && (
          <span className="text-gray-600 truncate max-w-[120px]">
            👤 {user.name}
          </span>
        )}
        <Link href="/scheduler" className="text-blue-600 hover:underline">
          Schedule
        </Link>
        <Link href="/log" className="text-blue-600 hover:underline">
          Storico
        </Link>
        <Link href="/api/auth/logout" className="text-red-600 hover:underline">
          Logout
        </Link>
      </div>
    </nav>
  );
}
