'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);
  const userDropdownRef = useRef(null);
  const pathname = usePathname();

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleUserDropdown = () => setUserDropdownOpen((prev) => !prev);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  // Click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        if (userDropdownOpen) setUserDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [menuOpen, userDropdownOpen]);

  // Prevent scroll when menu open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Flag per prevenire double fetch in React Strict Mode
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Skip se già fetchato (React 18 Strict Mode double mount)
    if (fetchedRef.current) return;

    const fetchUser = async () => {
      try {
        fetchedRef.current = true;
        const res = await fetch('/api/user');
        const data = await res.json();
        if (data.user) setUser(data.user);
      } catch (error) {
        console.error('Errore nel recupero utente:', error);
        fetchedRef.current = false; // Reset on error per retry
      }
    };
    fetchUser();
  }, []);

  const isActive = (path) => pathname === path;

  const NavLink = ({ href, children, mobile = false }) => {
    const active = isActive(href);
    const baseClasses = mobile
      ? 'block px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95'
      : 'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95';

    const activeClasses = active
      ? 'bg-primary-50 text-primary-600 shadow-sm'
      : 'text-neutral-700 hover:bg-neutral-100';

    return (
      <Link
        href={href}
        className={`${baseClasses} ${activeClasses}`}
      >
        {children}
      </Link>
    );
  };

  return (
    <nav ref={menuRef} className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-neutral-200/50 shadow-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2 group touch-manipulation">
            <div className="text-xl sm:text-2xl group-hover:scale-110 group-active:scale-95 transition-transform duration-200">
              🔥
            </div>
            <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              Pannello Stufa
            </span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink href="/netatmo">Netatmo</NavLink>
            <NavLink href="/scheduler">Pianificazione</NavLink>
            <NavLink href="/maintenance">Manutenzione</NavLink>
            <NavLink href="/log">Storico</NavLink>
            <NavLink href="/errors">Allarmi</NavLink>

            {/* User dropdown */}
            {user && (
              <div className="relative ml-2" ref={userDropdownRef}>
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 hover:bg-white/90 backdrop-blur-sm border border-neutral-200/50 text-neutral-700 shadow-sm transition-all duration-200 active:scale-95"
                  aria-expanded={userDropdownOpen}
                >
                  <span className="text-sm">👤</span>
                  <span className="text-xs font-medium truncate max-w-[80px] xl:max-w-[120px]">{user.name}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl border border-neutral-200/50 rounded-xl shadow-glass-lg overflow-hidden z-[100]">
                    <div className="px-4 py-3 border-b border-neutral-200/50">
                      <p className="text-xs text-neutral-500">Connesso come</p>
                      <p className="text-sm font-medium text-neutral-800 truncate">{user.name}</p>
                      {user.email && (
                        <p className="text-xs text-neutral-500 truncate mt-0.5">{user.email}</p>
                      )}
                    </div>
                    <Link
                      href="/api/auth/logout"
                      className="block px-4 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors duration-200"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      Logout
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2.5 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-200 touch-manipulation"
            aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={menuOpen}
          >
            <svg
              className={`w-6 h-6 text-neutral-700 transition-transform duration-200 ${menuOpen ? 'rotate-90' : ''}`}
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

      {/* Mobile dropdown with slide animation */}
      <div
        className={`
          md:hidden overflow-hidden border-t border-neutral-200/50
          bg-white/95 backdrop-blur-xl shadow-glass-lg
          transition-all duration-300 ease-in-out
          ${menuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-4 py-3 space-y-1">
          {user && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-neutral-200/50 text-neutral-700 mb-2 shadow-sm">
              <span className="text-base">👤</span>
              <span className="text-sm font-medium truncate">{user.name}</span>
            </div>
          )}
          <NavLink href="/netatmo" mobile>Netatmo</NavLink>
          <NavLink href="/scheduler" mobile>Pianificazione</NavLink>
          <NavLink href="/maintenance" mobile>Manutenzione</NavLink>
          <NavLink href="/log" mobile>Storico</NavLink>
          <NavLink href="/errors" mobile>Allarmi</NavLink>

          {/* Logout separato visivamente */}
          <div className="pt-2 mt-2 border-t border-neutral-200/50">
            <Link
              href="/api/auth/logout"
              className="block px-4 py-3.5 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 active:bg-primary-100 transition-all duration-200 active:scale-95 touch-manipulation"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
