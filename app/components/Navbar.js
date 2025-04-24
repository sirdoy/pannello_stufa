'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user');
        const data = await res.json();
        if (data.user) setUser(data.user);
      } catch (error) {
        console.error('Errore nel recupero utente:', error);
      }
    };
    fetchUser();
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-lg font-semibold text-gray-800 hover:text-black">
        🔥 Pannello Stufa
      </Link>

      {/* Desktop menu */}
      <div className="hidden md:flex items-center space-x-4 text-sm">
        {user && (
          <span className="text-gray-600 truncate max-w-[120px]">
            👤 {user.name}
          </span>
        )}
        <Link href="/scheduler" className="text-blue-600 hover:underline">
          Pianificazione
        </Link>
        <Link href="/log" className="text-blue-600 hover:underline">
          Storico
        </Link>
        <Link href="/api/auth/logout" className="text-red-600 hover:underline">
          Logout
        </Link>
      </div>

      {/* Hamburger toggle */}
      <button onClick={toggleMenu} className="md:hidden text-gray-700 text-xl">
        ☰
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md border-t mt-2 p-4 flex flex-col space-y-3 text-sm md:hidden z-50">
          {user && (
            <span className="text-gray-600 truncate">👤 {user.name}</span>
          )}
          <Link href="/scheduler" onClick={() => setMenuOpen(false)} className="text-blue-600 hover:underline">
            Pianificazione
          </Link>
          <Link href="/log" onClick={() => setMenuOpen(false)} className="text-blue-600 hover:underline">
            Storico
          </Link>
          <Link href="/api/auth/logout" onClick={() => setMenuOpen(false)} className="text-red-600 hover:underline">
            Logout
          </Link>
        </div>
      )}
    </nav>
  );
}
