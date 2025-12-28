'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavigationStructureWithPreferences } from '@/lib/devices/deviceRegistry';
import { Home, Calendar, AlertCircle, Clock, Settings, User, LogOut, Menu, X, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [desktopDeviceDropdown, setDesktopDeviceDropdown] = useState(null);
  const [user, setUser] = useState(null);
  const [devicePreferences, setDevicePreferences] = useState({});

  const userDropdownRef = useRef(null);
  const settingsDropdownRef = useRef(null);
  const desktopDeviceRefs = useRef({});
  const pathname = usePathname();
  const navStructure = getNavigationStructureWithPreferences(devicePreferences);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setSettingsDropdownOpen(false);
    setDesktopDeviceDropdown(null);
  }, [pathname]);

  // Desktop: Click outside to close dropdowns
  useEffect(() => {
    if (!userDropdownOpen && !settingsDropdownOpen && !desktopDeviceDropdown) return;

    const handleClickOutside = (event) => {
      if (userDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }

      if (settingsDropdownOpen && settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target)) {
        setSettingsDropdownOpen(false);
      }

      if (desktopDeviceDropdown) {
        const ref = desktopDeviceRefs.current[desktopDeviceDropdown];
        if (ref && !ref.contains(event.target)) {
          setDesktopDeviceDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen, settingsDropdownOpen, desktopDeviceDropdown]);

  // Escape key to close everything
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
        setSettingsDropdownOpen(false);
        setDesktopDeviceDropdown(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Fetch user info and device preferences
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;

    const fetchData = async () => {
      try {
        fetchedRef.current = true;

        const userRes = await fetch('/api/user');
        const userData = await userRes.json();
        if (userData.user) setUser(userData.user);

        const prefsRes = await fetch('/api/devices/preferences');
        if (prefsRes.ok) {
          const prefsData = await prefsRes.json();
          setDevicePreferences(prefsData.preferences || {});
        }
      } catch (error) {
        console.error('Errore nel recupero dati:', error);
        fetchedRef.current = false;
      }
    };
    fetchData();
  }, []);

  const isActive = (path) => pathname === path;

  // Icon mapping for quick navigation
  const getIconForPath = (path) => {
    if (path === '/') return <Home className="w-5 h-5" />;
    if (path.includes('scheduler')) return <Calendar className="w-5 h-5" />;
    if (path.includes('errors')) return <AlertCircle className="w-5 h-5" />;
    if (path.includes('log')) return <Clock className="w-5 h-5" />;
    return null;
  };

  return (
    <>
      {/* Top Header - Desktop & Mobile */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-3xl border-b border-white/20 dark:border-white/10 shadow-liquid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-200">
                🏠
              </div>
              <span className="hidden sm:inline text-lg lg:text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                Smart Home
              </span>
            </Link>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center gap-4">

              {/* Device Dropdowns */}
              {navStructure.devices.map(device => (
                <div
                  key={device.id}
                  className="relative"
                  ref={(el) => (desktopDeviceRefs.current[device.id] = el)}
                >
                  <button
                    onClick={() => setDesktopDeviceDropdown(desktopDeviceDropdown === device.id ? null : device.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] relative group hover:scale-105 ${
                      pathname.startsWith(`/${device.id}`)
                        ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-xl text-primary-700 dark:text-primary-400 shadow-liquid-md ring-1 ring-primary-500/20 dark:ring-primary-500/30 ring-inset'
                        : 'bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-xl text-neutral-800 dark:text-neutral-200 hover:bg-white/[0.12] dark:hover:bg-white/[0.08] shadow-liquid-sm hover:shadow-liquid-md ring-1 ring-white/20 dark:ring-white/10 ring-inset'
                    }`}
                    aria-expanded={desktopDeviceDropdown === device.id}
                  >
                    <span className="text-lg">{device.icon}</span>
                    <span>{device.name}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${desktopDeviceDropdown === device.id ? 'rotate-180' : ''}`} aria-hidden="true" />
                    <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-primary-500 dark:bg-primary-400 transition-all duration-300 rounded-full ${
                      pathname.startsWith(`/${device.id}`) ? 'w-3/4' : 'w-0 group-hover:w-3/4'
                    }`} />
                  </button>

                  {desktopDeviceDropdown === device.id && (
                    <div className="absolute left-0 mt-2 w-56 bg-white/[0.10] dark:bg-white/[0.08] backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-xl shadow-liquid-lg overflow-hidden z-[9000] ring-1 ring-white/10 dark:ring-white/5 ring-inset">
                      {device.items.map(item => (
                        <Link
                          key={item.route}
                          href={item.route}
                          className={`block px-4 py-3 text-sm font-medium transition-all duration-200 ${
                            isActive(item.route)
                              ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-xl text-primary-700 dark:text-primary-400'
                              : 'text-neutral-800 dark:text-neutral-200 hover:bg-white/[0.08] dark:hover:bg-white/[0.05] backdrop-blur-xl'
                          }`}
                          onClick={() => setDesktopDeviceDropdown(null)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Global Links */}
              {navStructure.global.map(item => (
                <Link
                  key={item.route}
                  href={item.route}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] relative group hover:scale-105 ${
                    isActive(item.route)
                      ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-xl text-primary-700 dark:text-primary-400 shadow-liquid-md ring-1 ring-primary-500/20 dark:ring-primary-500/30 ring-inset'
                      : 'bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-xl text-neutral-800 dark:text-neutral-200 hover:bg-white/[0.12] dark:hover:bg-white/[0.08] shadow-liquid-sm hover:shadow-liquid-md ring-1 ring-white/20 dark:ring-white/10 ring-inset'
                  }`}
                >
                  {getIconForPath(item.route)}
                  <span>{item.label}</span>
                  <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-primary-500 dark:bg-primary-400 transition-all duration-300 rounded-full ${
                    isActive(item.route) ? 'w-3/4' : 'w-0 group-hover:w-3/4'
                  }`} />
                </Link>
              ))}

              {/* Settings Dropdown */}
              {navStructure.settings && navStructure.settings.length > 0 && (
                <div className="relative" ref={settingsDropdownRef}>
                  <button
                    onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] relative group hover:scale-105 ${
                      settingsDropdownOpen || navStructure.settings.some(item => isActive(item.route))
                        ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-xl text-primary-700 dark:text-primary-400 shadow-liquid-md ring-1 ring-primary-500/20 dark:ring-primary-500/30 ring-inset'
                        : 'bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-xl text-neutral-800 dark:text-neutral-200 hover:bg-white/[0.12] dark:hover:bg-white/[0.08] shadow-liquid-sm hover:shadow-liquid-md ring-1 ring-white/20 dark:ring-white/10 ring-inset'
                    }`}
                    aria-expanded={settingsDropdownOpen}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Impostazioni</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${settingsDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                    <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-primary-500 dark:bg-primary-400 transition-all duration-300 rounded-full ${
                      settingsDropdownOpen || navStructure.settings.some(item => isActive(item.route)) ? 'w-3/4' : 'w-0 group-hover:w-3/4'
                    }`} />
                  </button>

                  {settingsDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white/[0.10] dark:bg-white/[0.08] backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-xl shadow-liquid-lg overflow-hidden z-[9000] ring-1 ring-white/10 dark:ring-white/5 ring-inset">
                      {navStructure.settings.map((item, idx) => (
                        <Link
                          key={item.id}
                          href={item.route}
                          className={`block px-4 py-3 text-sm transition-all duration-200 ${
                            idx !== navStructure.settings.length - 1 ? 'border-b border-white/10 dark:border-white/5' : ''
                          } ${
                            isActive(item.route)
                              ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-xl text-primary-700 dark:text-primary-400 font-medium'
                              : 'text-neutral-800 dark:text-neutral-200 hover:bg-white/[0.08] dark:hover:bg-white/[0.05] backdrop-blur-xl'
                          }`}
                          onClick={() => setSettingsDropdownOpen(false)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{item.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium">{item.label}</div>
                              {item.description && (
                                <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{item.description}</div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* User & Menu Buttons */}
            <div className="flex items-center gap-3">

              {/* Desktop User Dropdown */}
              {user && (
                <div className="hidden lg:block relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] dark:bg-white/[0.05] hover:bg-white/[0.12] dark:hover:bg-white/[0.08] backdrop-blur-2xl border border-white/20 dark:border-white/10 text-neutral-700 dark:text-neutral-300 shadow-liquid-sm hover:shadow-liquid-md ring-1 ring-white/10 dark:ring-white/5 ring-inset transition-all duration-200 min-h-[44px] hover:scale-105"
                    aria-expanded={userDropdownOpen}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium truncate max-w-[140px]">{user.name}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white/[0.10] dark:bg-white/[0.08] backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-xl shadow-liquid-lg overflow-hidden z-[9000] ring-1 ring-white/10 dark:ring-white/5 ring-inset">
                      <div className="px-4 py-3 border-b border-white/10 dark:border-white/5">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Connesso come</p>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate mt-0.5">{user.name}</p>
                        {user.email && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-1">{user.email}</p>
                        )}
                      </div>
                      <Link
                        href="/auth/logout"
                        className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors duration-200"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl bg-white/[0.08] dark:bg-white/[0.05] hover:bg-white/[0.12] dark:hover:bg-white/[0.08] transition-all duration-200"
                aria-label={mobileMenuOpen ? 'Chiudi menu' : 'Apri menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                ) : (
                  <Menu className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed top-16 left-0 right-0 bottom-0 bg-black/40 backdrop-blur-md z-[9000] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Menu Panel */}
          <div className="fixed top-16 left-0 right-0 bottom-20 bg-white/[0.10] dark:bg-white/[0.08] backdrop-blur-3xl z-[9001] lg:hidden overflow-y-auto">
            <div className="px-4 py-4 space-y-3">

              {/* User Info */}
              {user && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl shadow-liquid-sm ring-1 ring-white/20 dark:ring-white/10 ring-inset mb-4">
                  <User className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100">{user.name}</p>
                    {user.email && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{user.email}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Device Sections */}
              {navStructure.devices.map(device => (
                <div key={device.id} className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="text-lg">{device.icon}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      {device.name}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {device.items.map(item => (
                      <Link
                        key={item.route}
                        href={item.route}
                        className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive(item.route)
                            ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-2xl text-primary-700 dark:text-primary-400 shadow-liquid-sm ring-1 ring-primary-500/20 dark:ring-primary-500/30 ring-inset'
                            : 'text-neutral-800 dark:text-neutral-200 bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.12] dark:hover:bg-white/[0.08] shadow-liquid-sm ring-1 ring-white/20 dark:ring-white/10 ring-inset'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Settings Section */}
              {navStructure.settings && navStructure.settings.length > 0 && (
                <div className="space-y-2 pt-3 mt-3 border-t border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Settings className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Impostazioni
                    </span>
                  </div>

                  <div className="space-y-1">
                    {navStructure.settings.map(item => (
                      <Link
                        key={item.route}
                        href={item.route}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                          isActive(item.route)
                            ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-2xl text-primary-700 dark:text-primary-400 shadow-liquid-sm ring-1 ring-primary-500/20 dark:ring-primary-500/30 ring-inset'
                            : 'text-neutral-800 dark:text-neutral-200 bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.12] dark:hover:bg-white/[0.08] shadow-liquid-sm ring-1 ring-white/20 dark:ring-white/10 ring-inset'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Logout */}
              <div className="pt-3 mt-3 border-t border-white/20 dark:border-white/10">
                <Link
                  href="/auth/logout"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary-700 dark:text-primary-400 bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-2xl hover:bg-primary-500/15 dark:hover:bg-primary-500/25 shadow-liquid-sm ring-1 ring-primary-500/20 dark:ring-primary-500/30 ring-inset transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation - iOS Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-3xl border-t border-white/20 dark:border-white/10 shadow-liquid pb-safe">
        <div className="grid grid-cols-4 gap-4 p-3">

          {/* Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl min-h-[48px] transition-all duration-200 ${
              isActive('/')
                ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Home className="w-6 h-6 mb-1.5" />
            <span className="text-[10px] font-medium truncate max-w-full">Home</span>
          </Link>

          {/* Scheduler */}
          <Link
            href="/stove/scheduler"
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl min-h-[48px] transition-all duration-200 ${
              pathname.includes('scheduler')
                ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Calendar className="w-6 h-6 mb-1.5" />
            <span className="text-[10px] font-medium truncate max-w-full">Orari</span>
          </Link>

          {/* Errors */}
          <Link
            href="/stove/errors"
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl min-h-[48px] transition-all duration-200 ${
              pathname.includes('errors')
                ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <AlertCircle className="w-6 h-6 mb-1.5" />
            <span className="text-[10px] font-medium truncate max-w-full">Errori</span>
          </Link>

          {/* Log */}
          <Link
            href="/log"
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl min-h-[48px] transition-all duration-200 ${
              pathname.includes('log')
                ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Clock className="w-6 h-6 mb-1.5" />
            <span className="text-[10px] font-medium truncate max-w-full">Log</span>
          </Link>
        </div>
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="h-16 lg:h-20" aria-hidden="true" />
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </>
  );
}
