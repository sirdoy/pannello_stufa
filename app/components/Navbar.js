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
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-neutral-200/50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
              🔥
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              Pannello Stufa
            </span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 mr-4 px-3 py-2 rounded-xl bg-neutral-100 text-neutral-700">
                <span className="text-sm">👤</span>
                <span className="text-sm font-medium truncate max-w-[120px]">{user.name}</span>
              </div>
            )}
            <Link
              href="/scheduler"
              className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors duration-200"
            >
              Pianificazione
            </Link>
            <Link
              href="/log"
              className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors duration-200"
            >
              Storico
            </Link>
            <Link
              href="/api/auth/logout"
              className="px-4 py-2 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors duration-200"
            >
              Logout
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-xl hover:bg-neutral-100 transition-colors duration-200"
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6 text-neutral-700"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {menuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-neutral-200/50 bg-white/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-2">
            {user && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-100 text-neutral-700 mb-3">
                <span>👤</span>
                <span className="text-sm font-medium truncate">{user.name}</span>
              </div>
            )}
            <Link
              href="/scheduler"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors duration-200"
            >
              Pianificazione
            </Link>
            <Link
              href="/log"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors duration-200"
            >
              Storico
            </Link>
            <Link
              href="/api/auth/logout"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors duration-200"
            >
              Logout
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
