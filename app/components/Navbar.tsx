'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavigationStructureWithPreferences } from '@/lib/devices/deviceRegistry';
import { Home, Calendar, AlertCircle, Clock, Settings, User, LogOut, Menu, X, ChevronDown, Activity, Lightbulb } from 'lucide-react';
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
 * Get mobile bottom nav quick actions based on enabled devices
 * Max 4 items: Home + device-specific actions + Log
 * Priority: Stove > Thermostat > Lights
 */
export function getMobileQuickActions(navStructure: any) {
  const actions = [];

  // Always: Home
  actions.push({ href: '/', icon: Home, label: 'Home' });

  // Check which devices are enabled
  const devices = navStructure.devices || [];
  const hasStove = devices.some((d: any) => d.id === 'stove');
  const hasThermostat = devices.some((d: any) => d.id === 'thermostat');
  const hasLights = devices.some((d: any) => d.id === 'lights');

  // Priority 1: Stove (Orari + Errori)
  if (hasStove) {
    actions.push({ href: '/stove/scheduler', icon: Calendar, label: 'Orari' });
    actions.push({ href: '/stove/errors', icon: AlertCircle, label: 'Errori' });
  }
  // Priority 2: Thermostat only (Programmazione)
  else if (hasThermostat) {
    actions.push({ href: '/thermostat/schedule', icon: Calendar, label: 'Programmazione' });
  }
  // Priority 3: Lights only (Scene)
  else if (hasLights) {
    actions.push({ href: '/lights/scenes', icon: Lightbulb, label: 'Scene' });
  }

  // Always: Log (last position)
  actions.push({ href: '/log', icon: Clock, label: 'Log' });

  return actions.slice(0, 4); // Max 4 items
}

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
  const [desktopDeviceDropdown, setDesktopDeviceDropdown] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [devicePreferences, setDevicePreferences] = useState<any>({});

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDeviceRefs = useRef<any>({});
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

    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }

      if (settingsDropdownOpen && settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setSettingsDropdownOpen(false);
      }

      if (desktopDeviceDropdown) {
        const ref = desktopDeviceRefs.current[desktopDeviceDropdown];
        if (ref && !ref.contains(event.target as Node)) {
          setDesktopDeviceDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen, settingsDropdownOpen, desktopDeviceDropdown]);

  // Escape key to close everything
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
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

  // Fetch user info and device config
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;

    const fetchData = async () => {
      try {
        fetchedRef.current = true;

        const userRes = await fetch('/api/user');
        const userData = await userRes.json();
        if (userData.user) setUser(userData.user);

        // Use unified config endpoint
        const configRes = await fetch('/api/devices/config');
        if (configRes.ok) {
          const configData = await configRes.json();
          // Convert enabledDevices array to preferences object for navbar
          const prefs: Record<string, boolean> = {};
          (configData.enabledDevices || []).forEach((id: string) => {
            prefs[id] = true;
          });
          setDevicePreferences(prefs);
        }
      } catch (error) {
        console.error('Errore nel recupero dati:', error);
        fetchedRef.current = false;
      }
    };
    fetchData();
  }, []);

  const isActive = (path: string) => pathname === path;

  // Icon mapping for quick navigation
  const getIconForPath = (path: string) => {
    if (path === '/') return <Home className="w-5 h-5" />;
    if (path.includes('scheduler')) return <Calendar className="w-5 h-5" />;
    if (path.includes('errors')) return <AlertCircle className="w-5 h-5" />;
    if (path.includes('log')) return <Clock className="w-5 h-5" />;
    if (path.includes('monitoring')) return <Activity className="w-5 h-5" />;
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
        pt-[env(safe-area-inset-top)]
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
                  ref={(el) => { if (el) desktopDeviceRefs.current[device.id] = el; }}
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
              {navStructure.global && navStructure.global.map(item => (
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
                      ${settingsDropdownOpen || navStructure.settings.some(item => {
                        // Check main route or submenu routes
                        if (item.route && isActive(item.route)) return true;
                        if (item.submenu) {
                          return item.submenu.some(subitem => isActive(subitem.route));
                        }
                        return false;
                      }) ? navItemActive : navItemInactive}
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
                      ${settingsDropdownOpen || navStructure.settings.some(item => {
                        if (item.route && isActive(item.route)) return true;
                        if (item.submenu) {
                          return item.submenu.some(subitem => isActive(subitem.route));
                        }
                        return false;
                      }) ? 'w-3/4 opacity-100' : 'w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-50'}
                    `} />
                  </button>

                  {settingsDropdownOpen && (
                    <DropdownContainer className="w-80" align="right">
                      {navStructure.settings.map((item, idx) => {
                        // Se l'item ha un submenu, renderizzo la struttura gerarchica
                        if (item.submenu && item.submenu.length > 0) {
                          return (
                            <div key={item.id} className="space-y-1">
                              {/* Header del submenu (non cliccabile) */}
                              <div className="px-4 py-2 text-sm font-semibold text-slate-400 [html:not(.dark)_&]:text-slate-600 flex items-center gap-2">
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                              </div>
                              {/* Voci del submenu */}
                              {item.submenu.map((subitem, subIdx) => (
                                <DropdownItem
                                  key={subitem.id}
                                  href={subitem.route}
                                  icon={subitem.icon}
                                  label={subitem.label}
                                  description={subitem.description}
                                  isActive={isActive(subitem.route)}
                                  animationDelay={(idx + subIdx) * 40}
                                  className="ml-4"
                                />
                              ))}
                            </div>
                          );
                        }
                        // Altrimenti renderizzo normalmente
                        return (
                          <DropdownItem
                            key={item.id}
                            href={item.route}
                            icon={item.icon}
                            label={item.label}
                            description={item.description}
                            isActive={isActive(item.route)}
                            animationDelay={idx * 40}
                          />
                        );
                      })}
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
              fixed left-0 right-0 bottom-0
              top-[calc(4rem+env(safe-area-inset-top))]
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
            fixed left-0 right-0 bottom-20
            top-[calc(4rem+env(safe-area-inset-top))]
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

              {/* Global Navigation Section */}
              {navStructure.global && navStructure.global.length > 0 && (
                <MenuSection
                  title=""
                  hasBorder={true}
                >
                  {navStructure.global.map((item, idx) => (
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
              )}

              {/* Settings Section */}
              {navStructure.settings && navStructure.settings.length > 0 && (
                <MenuSection
                  icon={<Settings className="w-5 h-5" />}
                  title="Impostazioni"
                  hasBorder={true}
                >
                  {navStructure.settings.map((item, idx) => {
                    // Se l'item ha un submenu, renderizzo la struttura gerarchica
                    if (item.submenu && item.submenu.length > 0) {
                      return (
                        <div key={item.id} className="space-y-1">
                          {/* Header del submenu (non cliccabile) */}
                          <div className="px-3 py-2 text-sm font-semibold text-slate-400 [html:not(.dark)_&]:text-slate-600 flex items-center gap-2">
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                          {/* Voci del submenu */}
                          {item.submenu.map((subitem, subIdx) => (
                            <MenuItem
                              key={subitem.id}
                              href={subitem.route}
                              icon={subitem.icon}
                              label={subitem.label}
                              isActive={isActive(subitem.route)}
                              animationDelay={(idx + subIdx) * 50}
                              className="ml-4"
                            />
                          ))}
                        </div>
                      );
                    }
                    // Altrimenti renderizzo normalmente
                    return (
                      <MenuItem
                        key={item.route}
                        href={item.route}
                        icon={item.icon}
                        label={item.label}
                        isActive={isActive(item.route)}
                        animationDelay={idx * 50}
                      />
                    );
                  })}
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
        {(() => {
          const quickActions = getMobileQuickActions(navStructure);
          const gridCols = quickActions.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

          return (
            <div className={`grid ${gridCols} gap-2 p-2`}>
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                const isActiveRoute = isActive(action.href);

                return (
                  <TransitionLink
                    key={action.href}
                    href={action.href}
                    className={`
                      flex flex-col items-center justify-center
                      py-2 px-2
                      rounded-xl
                      min-h-[56px]
                      transition-all duration-200
                      ${isActiveRoute
                        ? 'bg-ember-500/15 text-ember-400 shadow-ember-glow-sm [html:not(.dark)_&]:bg-ember-500/10 [html:not(.dark)_&]:text-ember-600 [html:not(.dark)_&]:shadow-none'
                        : 'text-slate-500 hover:text-slate-300 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700'
                      }
                    `}
                  >
                    <IconComponent className="w-6 h-6 mb-1" />
                    <Text as="span" className="text-[10px] font-display">{action.label}</Text>
                  </TransitionLink>
                );
              })}
            </div>
          );
        })()}
      </nav>

      {/* Spacer for fixed navigation (includes safe-area for PWA) */}
      <div className="h-[calc(4rem+env(safe-area-inset-top))] lg:h-[calc(4.5rem+env(safe-area-inset-top))]" aria-hidden="true" />
    </>
  );
}
