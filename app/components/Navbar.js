'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavigationStructure } from '@/lib/devices/deviceRegistry';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeDeviceDropdown, setActiveDeviceDropdown] = useState(null);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);
  const userDropdownRef = useRef(null);
  const deviceDropdownRefs = useRef({});
  const pathname = usePathname();

  const navStructure = getNavigationStructure();

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleUserDropdown = () => setUserDropdownOpen((prev) => !prev);
  const toggleDeviceDropdown = (deviceId) => {
    setActiveDeviceDropdown(activeDeviceDropdown === deviceId ? null : deviceId);
  };

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setUserDropdownOpen(false);
    setActiveDeviceDropdown(null);
  }, [pathname]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Mobile menu
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      // User dropdown
      if (userDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }

      // Device dropdowns
      if (activeDeviceDropdown) {
        const activeDropdownRef = deviceDropdownRefs.current[activeDeviceDropdown];
        if (activeDropdownRef && !activeDropdownRef.contains(event.target)) {
          setActiveDeviceDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, userDropdownOpen, activeDeviceDropdown]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        if (userDropdownOpen) setUserDropdownOpen(false);
        if (activeDeviceDropdown) setActiveDeviceDropdown(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [menuOpen, userDropdownOpen, activeDeviceDropdown]);

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

  // Fetch user
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;

    const fetchUser = async () => {
      try {
        fetchedRef.current = true;
        const res = await fetch('/api/user');
        const data = await res.json();
        if (data.user) setUser(data.user);
      } catch (error) {
        console.error('Errore nel recupero utente:', error);
        fetchedRef.current = false;
      }
    };
    fetchUser();
  }, []);

  const isActive = (path) => pathname === path;

  const NavLink = ({ href, children, mobile = false }) => {
    const active = isActive(href);
    const baseClasses = mobile
      ? 'block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95'
      : 'px-3 lg:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95';

    const activeClasses = active
      ? 'bg-primary-50 text-primary-600 shadow-sm'
      : 'text-neutral-700 hover:bg-neutral-100';

    return (
      <Link href={href} className={`${baseClasses} ${activeClasses}`}>
        {children}
      </Link>
    );
  };

  return (
    <nav ref={menuRef} className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-neutral-200/50 shadow-glass">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-[4.5rem]">
          {/* Logo/Brand - Responsive */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group touch-manipulation flex-shrink-0">
            <div className="text-xl sm:text-2xl lg:text-3xl group-hover:scale-110 group-active:scale-95 transition-transform duration-200">
              🏠
            </div>
            {/* Full text on sm+, abbreviated on mobile */}
            <span className="hidden sm:inline text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              Smart Home
            </span>
            <span className="inline sm:hidden text-sm font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              Home
            </span>
          </Link>

          {/* Desktop menu - Starts at lg (1024px) */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* Device Dropdowns */}
            {navStructure.devices.map(device => (
              <div
                key={device.id}
                className="relative"
                ref={(el) => (deviceDropdownRefs.current[device.id] = el)}
              >
                <button
                  onClick={() => toggleDeviceDropdown(device.id)}
                  className={`flex items-center gap-1.5 px-3 xl:px-4 py-2 rounded-xl text-sm xl:text-base font-medium transition-all duration-200 active:scale-95 ${
                    pathname.startsWith(`/${device.id}`)
                      ? 'bg-primary-50 text-primary-600 shadow-sm'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                  aria-expanded={activeDeviceDropdown === device.id}
                >
                  <span className="text-base xl:text-lg">{device.icon}</span>
                  <span className="hidden xl:inline">{device.name}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${activeDeviceDropdown === device.id ? 'rotate-180' : ''}`}
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

                {/* Dropdown menu - Compact & Smooth */}
                {activeDeviceDropdown === device.id && (
                  <div className="absolute left-0 mt-2 w-48 xl:w-56 bg-white/95 backdrop-blur-xl border border-neutral-200/50 rounded-xl shadow-glass-lg overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {device.items.map(item => (
                      <Link
                        key={item.route}
                        href={item.route}
                        className={`block px-4 py-2.5 text-sm xl:text-base font-medium transition-colors duration-200 ${
                          isActive(item.route)
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                        onClick={() => setActiveDeviceDropdown(null)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Global Navigation Links */}
            {navStructure.global.map(item => (
              <NavLink key={item.route} href={item.route}>
                <span className="xl:inline hidden">{item.icon} {item.label}</span>
                <span className="xl:hidden">{item.icon}</span>
              </NavLink>
            ))}

            {/* User dropdown - Improved */}
            {user && (
              <div className="relative ml-2" ref={userDropdownRef}>
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 hover:bg-white/90 backdrop-blur-sm border border-neutral-200/50 text-neutral-700 shadow-sm transition-all duration-200 active:scale-95"
                  aria-expanded={userDropdownOpen}
                >
                  <span className="text-sm xl:text-base">👤</span>
                  <span className="text-xs xl:text-sm font-medium truncate max-w-[60px] xl:max-w-[140px]">
                    {user.name}
                  </span>
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
                  <div className="absolute right-0 mt-2 w-56 xl:w-64 bg-white/95 backdrop-blur-xl border border-neutral-200/50 rounded-xl shadow-glass-lg overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-neutral-200/50">
                      <p className="text-xs text-neutral-500">Connesso come</p>
                      <p className="text-sm xl:text-base font-medium text-neutral-800 truncate mt-0.5">{user.name}</p>
                      {user.email && (
                        <p className="text-xs text-neutral-500 truncate mt-1">{user.email}</p>
                      )}
                    </div>
                    <Link
                      href="/api/auth/logout"
                      className="block px-4 py-3 text-sm xl:text-base font-medium text-primary-600 hover:bg-primary-50 transition-colors duration-200"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      Logout
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile/Tablet menu button (< 1024px) */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 sm:p-2.5 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-200 touch-manipulation"
            aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={menuOpen}
          >
            <svg
              className={`w-5 h-5 sm:w-6 sm:h-6 text-neutral-700 transition-transform duration-300 ${menuOpen ? 'rotate-90' : ''}`}
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

      {/* Mobile/Tablet dropdown with slide animation */}
      <div
        className={`
          lg:hidden overflow-hidden border-t border-neutral-200/50
          bg-white/95 backdrop-blur-xl shadow-glass-lg
          transition-all duration-300 ease-in-out
          ${menuOpen ? 'max-h-[calc(100vh-3.5rem)] sm:max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-3 sm:px-4 py-3 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {/* User info on mobile */}
          {user && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-neutral-200/50 text-neutral-700 mb-3 shadow-sm">
              <span className="text-base sm:text-lg">👤</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium truncate">{user.name}</p>
                {user.email && (
                  <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                )}
              </div>
            </div>
          )}

          {/* Device Sections (Mobile Accordion) */}
          {navStructure.devices.map(device => (
            <div key={device.id} className="mb-2">
              <button
                onClick={() => toggleDeviceDropdown(device.id)}
                className={`w-full flex items-center justify-between px-4 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 ${
                  pathname.startsWith(`/${device.id}`)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200'
                }`}
              >
                <span className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-xl">{device.icon}</span>
                  <span>{device.name}</span>
                </span>
                <svg
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${activeDeviceDropdown === device.id ? 'rotate-180' : ''}`}
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

              {/* Mobile device submenu with smooth animation */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  activeDeviceDropdown === device.id ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="ml-4 space-y-1">
                  {device.items.map(item => (
                    <NavLink key={item.route} href={item.route} mobile>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Global Links */}
          <div className="pt-2 mt-2 border-t border-neutral-200/50">
            {navStructure.global.map(item => (
              <NavLink key={item.route} href={item.route} mobile>
                <span className="flex items-center gap-2">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </NavLink>
            ))}
          </div>

          {/* Logout */}
          <div className="pt-2 mt-2 border-t border-neutral-200/50 pb-2">
            <Link
              href="/api/auth/logout"
              className="flex items-center gap-2 px-4 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium text-primary-600 hover:bg-primary-50 active:bg-primary-100 transition-all duration-200 active:scale-95 touch-manipulation"
            >
              <span className="text-base">🚪</span>
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
