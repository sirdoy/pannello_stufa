'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavigationStructureWithPreferences } from '@/lib/devices/deviceRegistry';
import { Home, Calendar, AlertCircle, Clock, Settings, User, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import {
  DropdownContainer,
  DropdownItem,
  DropdownInfoCard,
  MenuSection,
  MenuItem,
  UserInfoCard
} from './navigation';
import Text from './ui/Text';
import TransitionLink from './TransitionLink';

/**
 * Navbar Component - Ember Noir Design System
 *
 * Sophisticated navigation with warm dark aesthetic.
 * Features desktop header, mobile menu, and bottom tab bar.
 */
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

  // Ember Noir nav item styles
  const navItemBase = `
    flex items-center gap-2
    px-4 py-2.5
    rounded-xl
    text-sm font-display font-medium
    transition-all duration-200
    min-h-[44px]
    relative group
  `;

  const navItemActive = `
    bg-ember-500/15
    text-ember-400
    shadow-ember-glow-sm
    [html:not(.dark)_&]:bg-ember-500/10
    [html:not(.dark)_&]:text-ember-700
    [html:not(.dark)_&]:shadow-none
  `;

  const navItemInactive = `
    bg-white/[0.04]
    text-slate-300
    hover:bg-white/[0.08]
    hover:text-slate-100
    border border-white/[0.06]
    hover:border-white/[0.1]
    [html:not(.dark)_&]:bg-black/[0.03]
    [html:not(.dark)_&]:text-slate-600
    [html:not(.dark)_&]:border-black/[0.06]
    [html:not(.dark)_&]:hover:bg-black/[0.05]
    [html:not(.dark)_&]:hover:text-slate-900
  `;

  return (
    <>
      {/* Top Header - Desktop & Mobile */}
      <header className="
        fixed top-0 left-0 right-0 z-50
        bg-slate-900/80
        backdrop-blur-xl
        border-b border-white/[0.06]
        shadow-card
        [html:not(.dark)_&]:bg-white/90
        [html:not(.dark)_&]:border-black/[0.06]
      ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-18">

            {/* Logo */}
            <TransitionLink
              href="/"
              className="flex items-center gap-3 group flex-shrink-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="
                text-2xl sm:text-3xl
                group-hover:scale-110
                transition-transform duration-200
              ">
                🔥
              </div>
              <Text
                as="span"
                weight="bold"
                className="
                  hidden sm:inline
                  text-lg lg:text-xl
                  font-display
                  gradient-text-ember
                "
              >
                Smart Home
              </Text>
            </TransitionLink>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center gap-3">

              {/* Device Dropdowns */}
              {navStructure.devices.map(device => (
                <div
                  key={device.id}
                  className="relative"
                  ref={(el) => (desktopDeviceRefs.current[device.id] = el)}
                >
                  <button
                    onClick={() => setDesktopDeviceDropdown(desktopDeviceDropdown === device.id ? null : device.id)}
                    className={`
                      ${navItemBase}
                      ${pathname.startsWith(`/${device.id}`) ? navItemActive : navItemInactive}
                    `.trim().replace(/\s+/g, ' ')}
                    aria-expanded={desktopDeviceDropdown === device.id}
                  >
                    <span className="text-lg">{device.icon}</span>
                    <span>{device.name}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        desktopDeviceDropdown === device.id ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                    {/* Active indicator */}
                    <div className={`
                      absolute -bottom-px left-1/2 -translate-x-1/2
                      h-0.5 rounded-full
                      bg-gradient-to-r from-ember-500 to-flame-500
                      transition-all duration-300
                      ${pathname.startsWith(`/${device.id}`) ? 'w-3/4 opacity-100' : 'w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-50'}
                    `} />
                  </button>

                  {desktopDeviceDropdown === device.id && (
                    <DropdownContainer className="w-64" align="left">
                      {device.items.map((item, idx) => (
                        <DropdownItem
                          key={item.route}
                          href={item.route}
                          icon={getIconForPath(item.route)}
                          label={item.label}
                          isActive={isActive(item.route)}
                          animationDelay={idx * 40}
                        />
                      ))}
                    </DropdownContainer>
                  )}
                </div>
              ))}

              {/* Global Links */}
              {navStructure.global.map(item => (
                <Link
                  key={item.route}
                  href={item.route}
                  className={`
                    ${navItemBase}
                    ${isActive(item.route) ? navItemActive : navItemInactive}
                  `.trim().replace(/\s+/g, ' ')}
                >
                  {getIconForPath(item.route)}
                  <span>{item.label}</span>
                  {/* Active indicator */}
                  <div className={`
                    absolute -bottom-px left-1/2 -translate-x-1/2
                    h-0.5 rounded-full
                    bg-gradient-to-r from-ember-500 to-flame-500
                    transition-all duration-300
                    ${isActive(item.route) ? 'w-3/4 opacity-100' : 'w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-50'}
                  `} />
                </Link>
              ))}

              {/* Settings Dropdown */}
              {navStructure.settings && navStructure.settings.length > 0 && (
                <div className="relative" ref={settingsDropdownRef}>
                  <button
                    onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                    className={`
                      ${navItemBase}
                      ${settingsDropdownOpen || navStructure.settings.some(item => isActive(item.route)) ? navItemActive : navItemInactive}
                    `.trim().replace(/\s+/g, ' ')}
                    aria-expanded={settingsDropdownOpen}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Impostazioni</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        settingsDropdownOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                    {/* Active indicator */}
                    <div className={`
                      absolute -bottom-px left-1/2 -translate-x-1/2
                      h-0.5 rounded-full
                      bg-gradient-to-r from-ember-500 to-flame-500
                      transition-all duration-300
                      ${settingsDropdownOpen || navStructure.settings.some(item => isActive(item.route)) ? 'w-3/4 opacity-100' : 'w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-50'}
                    `} />
                  </button>

                  {settingsDropdownOpen && (
                    <DropdownContainer className="w-80" align="right">
                      {navStructure.settings.map((item, idx) => (
                        <DropdownItem
                          key={item.id}
                          href={item.route}
                          icon={item.icon}
                          label={item.label}
                          description={item.description}
                          isActive={isActive(item.route)}
                          animationDelay={idx * 40}
                        />
                      ))}
                    </DropdownContainer>
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
                    className={`
                      ${navItemBase}
                      ${navItemInactive}
                    `.trim().replace(/\s+/g, ' ')}
                    aria-expanded={userDropdownOpen}
                  >
                    <User className="w-5 h-5" />
                    <span className="truncate max-w-[140px]">{user.name}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        userDropdownOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {userDropdownOpen && (
                    <DropdownContainer className="w-72" align="right">
                      <DropdownInfoCard
                        title="Connesso come"
                        subtitle={user.name}
                        details={user.email}
                      />
                      <DropdownItem
                        href="/auth/logout"
                        icon={<LogOut className="w-5 h-5" />}
                        label="Logout"
                        isActive={false}
                        className="text-flame-400 dark:text-flame-400 [html:not(.dark)_&]:text-flame-600"
                      />
                    </DropdownContainer>
                  )}
                </div>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="
                  lg:hidden
                  p-2.5
                  rounded-xl
                  bg-white/[0.04] dark:bg-white/[0.04]
                  border border-white/[0.06] dark:border-white/[0.06]
                  hover:bg-white/[0.08] dark:hover:bg-white/[0.08]
                  transition-all duration-200
                  [html:not(.dark)_&]:bg-black/[0.03]
                  [html:not(.dark)_&]:border-black/[0.06]
                "
                aria-label={mobileMenuOpen ? 'Chiudi menu' : 'Apri menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-slate-300 [html:not(.dark)_&]:text-slate-600" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-300 [html:not(.dark)_&]:text-slate-600" />
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
            className="
              fixed top-16 left-0 right-0 bottom-0
              bg-slate-950/60
              backdrop-blur-md
              z-[9000] lg:hidden
              [html:not(.dark)_&]:bg-slate-900/40
            "
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Menu Panel */}
          <div className="
            fixed top-16 left-0 right-0 bottom-20
            bg-slate-900/95
            backdrop-blur-2xl
            z-[9001] lg:hidden
            overflow-y-auto
            animate-fade-in-down
            [html:not(.dark)_&]:bg-white/95
          ">
            <div className="px-4 py-5 space-y-4">

              {/* User Info */}
              {user && (
                <UserInfoCard
                  icon={User}
                  name={user.name}
                  email={user.email}
                />
              )}

              {/* Device Sections */}
              {navStructure.devices.map(device => (
                <MenuSection
                  key={device.id}
                  icon={device.icon}
                  title={device.name}
                >
                  {device.items.map((item, idx) => (
                    <MenuItem
                      key={item.route}
                      href={item.route}
                      icon={getIconForPath(item.route)}
                      label={item.label}
                      isActive={isActive(item.route)}
                      animationDelay={idx * 50}
                    />
                  ))}
                </MenuSection>
              ))}

              {/* Settings Section */}
              {navStructure.settings && navStructure.settings.length > 0 && (
                <MenuSection
                  icon={<Settings className="w-5 h-5" />}
                  title="Impostazioni"
                  hasBorder={true}
                >
                  {navStructure.settings.map((item, idx) => (
                    <MenuItem
                      key={item.route}
                      href={item.route}
                      icon={item.icon}
                      label={item.label}
                      isActive={isActive(item.route)}
                      animationDelay={idx * 50}
                    />
                  ))}
                </MenuSection>
              )}

              {/* Logout */}
              <MenuSection title="" hasBorder={true}>
                <MenuItem
                  href="/auth/logout"
                  icon={<LogOut className="w-6 h-6" />}
                  label="Logout"
                  variant="prominent"
                />
              </MenuSection>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation - Ember Noir Style */}
      <nav className="
        fixed bottom-0 left-0 right-0 z-50 lg:hidden
        bg-slate-900/90
        backdrop-blur-xl
        border-t border-white/[0.06]
        shadow-[0_-4px_24px_rgba(0,0,0,0.15)]
        pb-safe
        [html:not(.dark)_&]:bg-white/90
        [html:not(.dark)_&]:border-black/[0.06]
        [html:not(.dark)_&]:shadow-[0_-4px_24px_rgba(0,0,0,0.08)]
      ">
        <div className="grid grid-cols-4 gap-2 p-2">
          {/* Home */}
          <TransitionLink
            href="/"
            className={`
              flex flex-col items-center justify-center
              py-2 px-2
              rounded-xl
              min-h-[56px]
              transition-all duration-200
              ${isActive('/')
                ? 'bg-ember-500/15 text-ember-400 shadow-ember-glow-sm [html:not(.dark)_&]:bg-ember-500/10 [html:not(.dark)_&]:text-ember-600 [html:not(.dark)_&]:shadow-none'
                : 'text-slate-500 hover:text-slate-300 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700'
              }
            `}
          >
            <Home className="w-6 h-6 mb-1" />
            <Text as="span" weight="medium" className="text-[10px] font-display">Home</Text>
          </TransitionLink>

          {/* Scheduler */}
          <TransitionLink
            href="/stove/scheduler"
            className={`
              flex flex-col items-center justify-center
              py-2 px-2
              rounded-xl
              min-h-[56px]
              transition-all duration-200
              ${pathname.includes('scheduler')
                ? 'bg-ember-500/15 text-ember-400 shadow-ember-glow-sm [html:not(.dark)_&]:bg-ember-500/10 [html:not(.dark)_&]:text-ember-600 [html:not(.dark)_&]:shadow-none'
                : 'text-slate-500 hover:text-slate-300 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700'
              }
            `}
          >
            <Calendar className="w-6 h-6 mb-1" />
            <Text as="span" weight="medium" className="text-[10px] font-display">Orari</Text>
          </TransitionLink>

          {/* Errors */}
          <TransitionLink
            href="/stove/errors"
            className={`
              flex flex-col items-center justify-center
              py-2 px-2
              rounded-xl
              min-h-[56px]
              transition-all duration-200
              ${pathname.includes('errors')
                ? 'bg-ember-500/15 text-ember-400 shadow-ember-glow-sm [html:not(.dark)_&]:bg-ember-500/10 [html:not(.dark)_&]:text-ember-600 [html:not(.dark)_&]:shadow-none'
                : 'text-slate-500 hover:text-slate-300 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700'
              }
            `}
          >
            <AlertCircle className="w-6 h-6 mb-1" />
            <Text as="span" weight="medium" className="text-[10px] font-display">Errori</Text>
          </TransitionLink>

          {/* Log */}
          <TransitionLink
            href="/log"
            className={`
              flex flex-col items-center justify-center
              py-2 px-2
              rounded-xl
              min-h-[56px]
              transition-all duration-200
              ${pathname.includes('log')
                ? 'bg-ember-500/15 text-ember-400 shadow-ember-glow-sm [html:not(.dark)_&]:bg-ember-500/10 [html:not(.dark)_&]:text-ember-600 [html:not(.dark)_&]:shadow-none'
                : 'text-slate-500 hover:text-slate-300 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700'
              }
            `}
          >
            <Clock className="w-6 h-6 mb-1" />
            <Text as="span" weight="medium" className="text-[10px] font-display">Log</Text>
          </TransitionLink>
        </div>
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="h-16 lg:h-18" aria-hidden="true" />
    </>
  );
}
