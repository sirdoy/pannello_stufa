'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavigationStructureWithPreferences } from '@/lib/devices/deviceRegistry';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [desktopDeviceDropdown, setDesktopDeviceDropdown] = useState(null);
  const [mobileDeviceDropdown, setMobileDeviceDropdown] = useState(null);
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
    setMobileDeviceDropdown(null);
  }, [pathname]);

  // Desktop: Click outside to close dropdowns
  useEffect(() => {
    if (!userDropdownOpen && !settingsDropdownOpen && !desktopDeviceDropdown) return;

    const handleClickOutside = (event) => {
      // User dropdown
      if (userDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }

      // Settings dropdown
      if (settingsDropdownOpen && settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target)) {
        setSettingsDropdownOpen(false);
      }

      // Device dropdowns
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
        setMobileDeviceDropdown(null);
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

        // Fetch user
        const userRes = await fetch('/api/user');
        const userData = await userRes.json();
        if (userData.user) setUser(userData.user);

        // Fetch device preferences
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

  const NavLink = ({ href, children, mobile = false, onClick }) => {
    const active = isActive(href);
    const baseClasses = mobile
      ? 'block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden'
      : 'px-3 lg:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200';

    const activeClasses = mobile
      ? active
        ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-2xl text-primary-700 dark:text-primary-400 shadow-liquid-sm ring-1 ring-primary-500/20 dark:ring-primary-500/30 ring-inset before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-400/10 dark:before:from-primary-400/20 before:to-transparent before:pointer-events-none'
        : 'text-neutral-800 dark:text-neutral-200 bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.12] dark:hover:bg-white/[0.08] shadow-liquid-sm ring-1 ring-white/20 dark:ring-white/10 ring-inset before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 dark:before:from-white/5 before:to-transparent before:pointer-events-none'
      : active
        ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-xl text-primary-700 dark:text-primary-400 shadow-liquid-sm ring-1 ring-primary-500/20 dark:ring-primary-500/30 ring-inset'
        : 'text-neutral-800 dark:text-neutral-200 bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-xl hover:bg-white/[0.12] dark:hover:bg-white/[0.08] shadow-liquid-sm ring-1 ring-white/20 dark:ring-white/10 ring-inset';

    return (
      <Link
        href={href}
        className={`${baseClasses} ${activeClasses}`}
        onClick={onClick}
      >
        <span className={mobile ? 'relative z-10' : ''}>{children}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-3xl border-b border-white/20 dark:border-white/10 shadow-liquid">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-[4.5rem]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0">
              <div className="text-xl sm:text-2xl lg:text-3xl group-hover:scale-110 transition-transform duration-200">
                🏠
              </div>
              <span className="hidden sm:inline text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                Smart Home
              </span>
              <span className="inline sm:hidden text-sm font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                Home
              </span>
            </Link>

            {/* Desktop Navigation (lg+) */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">

              {/* Device Dropdowns */}
              {navStructure.devices.map(device => (
                <div
                  key={device.id}
                  className="relative"
                  ref={(el) => (desktopDeviceRefs.current[device.id] = el)}
                >
                  <button
                    onClick={() => setDesktopDeviceDropdown(desktopDeviceDropdown === device.id ? null : device.id)}
                    className={`flex items-center gap-1.5 px-3 xl:px-4 py-2 rounded-xl text-sm xl:text-base font-medium transition-all duration-200 ${
                      pathname.startsWith(`/${device.id}`)
                        ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-xl text-primary-700 dark:text-primary-400 shadow-liquid-sm ring-1 ring-primary-500/20 dark:ring-primary-500/30 ring-inset'
                        : 'bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-xl text-neutral-800 dark:text-neutral-200 hover:bg-white/[0.12] dark:hover:bg-white/[0.08] shadow-liquid-sm ring-1 ring-white/20 dark:ring-white/10 ring-inset'
                    }`}
                    aria-expanded={desktopDeviceDropdown === device.id}
                  >
                    <span className="text-base xl:text-lg">{device.icon}</span>
                    <span className="hidden xl:inline">{device.name}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${desktopDeviceDropdown === device.id ? 'rotate-180' : ''}`}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Desktop Dropdown Menu */}
                  {desktopDeviceDropdown === device.id && (
                    <div className="absolute left-0 mt-2 w-48 xl:w-56 bg-white/[0.10] dark:bg-white/[0.08] backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-xl shadow-liquid-lg overflow-hidden z-[9000] ring-1 ring-white/10 dark:ring-white/5 ring-inset">
                      {device.items.map(item => (
                        <Link
                          key={item.route}
                          href={item.route}
                          className={`block px-4 py-2.5 text-sm xl:text-base font-medium transition-all duration-200 ${
                            isActive(item.route)
                              ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-xl text-primary-700 dark:text-primary-400 shadow-liquid-sm'
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
                <NavLink key={item.route} href={item.route}>
                  <span className="xl:inline hidden">{item.icon} {item.label}</span>
                  <span className="xl:hidden">{item.icon}</span>
                </NavLink>
              ))}

              {/* Settings Dropdown */}
              {navStructure.settings && navStructure.settings.length > 0 && (
                <div className="relative" ref={settingsDropdownRef}>
                  <button
                    onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                    className={`flex items-center gap-1.5 px-3 xl:px-4 py-2 rounded-xl text-sm xl:text-base font-medium transition-all duration-200 ${
                      settingsDropdownOpen || navStructure.settings.some(item => isActive(item.route))
                        ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-xl text-primary-700 dark:text-primary-400 shadow-liquid-sm ring-1 ring-primary-500/20 dark:ring-primary-500/30 ring-inset'
                        : 'bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-xl text-neutral-800 dark:text-neutral-200 hover:bg-white/[0.12] dark:hover:bg-white/[0.08] shadow-liquid-sm ring-1 ring-white/20 dark:ring-white/10 ring-inset'
                    }`}
                    aria-expanded={settingsDropdownOpen}
                  >
                    <span className="text-base xl:text-lg">⚙️</span>
                    <span className="xl:inline hidden">Impostazioni</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${settingsDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {settingsDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 xl:w-72 bg-white/[0.10] dark:bg-white/[0.08] backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-xl shadow-liquid-lg overflow-hidden z-[9000] ring-1 ring-white/10 dark:ring-white/5 ring-inset">
                      {navStructure.settings.map((item, idx) => (
                        <Link
                          key={item.id}
                          href={item.route}
                          className={`block px-4 py-3 text-sm xl:text-base transition-all duration-200 ${
                            idx !== navStructure.settings.length - 1
                              ? 'border-b border-white/10 dark:border-white/5'
                              : ''
                          } ${
                            isActive(item.route)
                              ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-xl text-primary-700 dark:text-primary-400 font-medium shadow-liquid-sm'
                              : 'text-neutral-800 dark:text-neutral-200 hover:bg-white/[0.08] dark:hover:bg-white/[0.05] backdrop-blur-xl'
                          }`}
                          onClick={() => setSettingsDropdownOpen(false)}
                        >
                          <div className="flex items-center gap-2">
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

              {/* User Dropdown */}
              {user && (
                <div className="relative ml-2" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.08] dark:bg-white/[0.05] hover:bg-white/[0.12] dark:hover:bg-white/[0.08] backdrop-blur-2xl border border-white/20 dark:border-white/10 text-neutral-700 dark:text-neutral-300 shadow-liquid-sm ring-1 ring-white/10 dark:ring-white/5 ring-inset transition-all duration-200"
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
                      aria-hidden="true"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 xl:w-64 bg-white/[0.10] dark:bg-white/[0.08] backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-xl shadow-liquid-lg overflow-hidden z-[9000] ring-1 ring-white/10 dark:ring-white/5 ring-inset">
                      <div className="px-4 py-3 border-b border-neutral-200/50 dark:border-neutral-700/50">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Connesso come</p>
                        <p className="text-sm xl:text-base font-medium text-neutral-800 dark:text-neutral-200 truncate mt-0.5">{user.name}</p>
                        {user.email && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-1">{user.email}</p>
                        )}
                      </div>
                      <Link
                        href="/auth/logout"
                        className="block px-4 py-3 text-sm xl:text-base font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors duration-200"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Logout
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 sm:p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
              aria-label={mobileMenuOpen ? 'Chiudi menu' : 'Apri menu'}
              aria-expanded={mobileMenuOpen}
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-700 dark:text-neutral-300"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay + Content */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop with fade-in animation */}
          <div
            className="fixed top-[3.5rem] sm:top-16 left-0 right-0 bottom-0 bg-black/40 backdrop-blur-md z-[9000] lg:hidden animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Menu Panel with slide-in animation */}
          <div className="fixed top-[3.5rem] sm:top-16 left-0 right-0 bottom-0 bg-white/[0.10] dark:bg-white/[0.08] backdrop-blur-3xl z-[9001] lg:hidden overflow-y-auto animate-slideInDown">
            <div className="px-3 sm:px-4 py-4 space-y-2">

              {/* User Info */}
              {user && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl shadow-liquid-sm ring-1 ring-white/20 dark:ring-white/10 ring-inset mb-4 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 dark:before:from-white/5 before:to-transparent before:pointer-events-none">
                  <span className="text-lg relative z-10">👤</span>
                  <div className="flex-1 min-w-0 relative z-10">
                    <p className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100">{user.name}</p>
                    {user.email && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{user.email}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Device Sections */}
              {navStructure.devices.map(device => (
                <div key={device.id} className="space-y-1">
                  <button
                    onClick={() => setMobileDeviceDropdown(mobileDeviceDropdown === device.id ? null : device.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                      pathname.startsWith(`/${device.id}`)
                        ? 'bg-primary-500/10 dark:bg-primary-500/20 backdrop-blur-2xl text-primary-700 dark:text-primary-400 shadow-liquid-sm ring-1 ring-primary-500/20 dark:ring-primary-500/30 ring-inset before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-400/10 dark:before:from-primary-400/20 before:to-transparent before:pointer-events-none'
                        : 'text-neutral-800 dark:text-neutral-200 bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.12] dark:hover:bg-white/[0.08] shadow-liquid-sm ring-1 ring-white/20 dark:ring-white/10 ring-inset before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 dark:before:from-white/5 before:to-transparent before:pointer-events-none'
                    }`}
                  >
                    <span className="flex items-center gap-3 relative z-10">
                      <span className="text-lg">{device.icon}</span>
                      <span>{device.name}</span>
                    </span>
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 relative z-10 ${mobileDeviceDropdown === device.id ? 'rotate-180' : ''}`}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Mobile Submenu */}
                  {mobileDeviceDropdown === device.id && (
                    <div className="ml-4 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {device.items.map(item => (
                        <NavLink
                          key={item.route}
                          href={item.route}
                          mobile
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Settings Section (Mobile) */}
              {navStructure.settings && navStructure.settings.length > 0 && (
                <div className="space-y-1 pt-3 mt-3 border-t border-white/20">
                  <button
                    onClick={() => setMobileDeviceDropdown(mobileDeviceDropdown === 'settings' ? null : 'settings')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                      navStructure.settings.some(item => isActive(item.route))
                        ? 'bg-primary-500/10 backdrop-blur-2xl text-primary-700 shadow-liquid-sm ring-1 ring-primary-500/20 ring-inset before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-400/10 before:to-transparent before:pointer-events-none'
                        : 'text-neutral-800 bg-white/[0.08] backdrop-blur-2xl hover:bg-white/[0.12] shadow-liquid-sm ring-1 ring-white/20 ring-inset before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none'
                    }`}
                  >
                    <span className="flex items-center gap-3 relative z-10">
                      <span className="text-lg">⚙️</span>
                      <span>Impostazioni</span>
                    </span>
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 relative z-10 ${mobileDeviceDropdown === 'settings' ? 'rotate-180' : ''}`}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Settings Submenu (Mobile) */}
                  {mobileDeviceDropdown === 'settings' && (
                    <div className="ml-4 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {navStructure.settings.map(item => (
                        <NavLink
                          key={item.route}
                          href={item.route}
                          mobile
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="flex items-center gap-3">
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Global Links */}
              <div className="pt-3 mt-3 border-t border-white/20 space-y-1">
                {navStructure.global.map(item => (
                  <NavLink
                    key={item.route}
                    href={item.route}
                    mobile
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                  </NavLink>
                ))}
              </div>

              {/* Logout */}
              <div className="pt-3 mt-3 border-t border-white/20">
                <Link
                  href="/auth/logout"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary-700 bg-primary-500/10 backdrop-blur-2xl hover:bg-primary-500/15 shadow-liquid-sm ring-1 ring-primary-500/20 ring-inset transition-all duration-200 active:scale-[0.98] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-400/10 before:to-transparent before:pointer-events-none"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-base relative z-10">🚪</span>
                  <span className="relative z-10">Logout</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
