'use client';

import { forwardRef, createContext, useContext, useState, useCallback, type ReactNode, type ComponentPropsWithoutRef, type Dispatch, type SetStateAction } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * SidebarContext - Manages sidebar collapse state
 *
 * Provides collapsed state and toggle function to child components.
 */
interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: Dispatch<SetStateAction<boolean>>;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

/**
 * useSidebar Hook - Access sidebar context
 *
 * @returns Sidebar context values
 * @example
 * const { collapsed, toggle } = useSidebar();
 */
export interface UseSidebarReturn {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: Dispatch<SetStateAction<boolean>>;
  toggleMobile: () => void;
}

function useSidebar(): UseSidebarReturn {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a DashboardLayout');
  }
  return context;
}

/**
 * Sidebar Variants - CVA Configuration
 */
const sidebarVariants = cva(
  // Base classes - fixed position sidebar
  [
    'fixed top-0 left-0 h-full z-40',
    'bg-slate-900 border-r border-slate-800',
    '[html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-slate-200',
    'transition-all duration-300 ease-in-out',
    'flex flex-col',
  ],
  {
    variants: {
      collapsed: {
        true: 'w-16',
        false: 'w-64',
      },
      mobile: {
        true: 'translate-x-0',
        false: '-translate-x-full lg:translate-x-0',
      },
    },
    defaultVariants: {
      collapsed: false,
      mobile: false,
    },
  }
);

/**
 * Main Content Variants - CVA Configuration
 */
const mainContentVariants = cva(
  // Base classes - content area that adjusts to sidebar
  [
    'min-h-screen transition-all duration-300 ease-in-out',
  ],
  {
    variants: {
      collapsed: {
        true: 'lg:ml-16',
        false: 'lg:ml-64',
      },
    },
    defaultVariants: {
      collapsed: false,
    },
  }
);

/**
 * Sidebar Component - Left navigation panel
 */
export interface SidebarProps extends ComponentPropsWithoutRef<'aside'> {
  children?: ReactNode;
}

const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { className, children, ...props },
  ref
) {
  const { collapsed, mobileOpen } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <MobileOverlay />
      )}

      {/* Sidebar */}
      <aside
        ref={ref}
        className={cn(
          sidebarVariants({ collapsed, mobile: mobileOpen }),
          // Hide on mobile unless explicitly opened
          'hidden lg:flex',
          mobileOpen && 'flex',
          className
        )}
        aria-label="Sidebar navigation"
        {...props}
      >
        {children}
      </aside>
    </>
  );
});

/**
 * MobileOverlay - Backdrop for mobile sidebar
 */
function MobileOverlay() {
  const { setMobileOpen } = useSidebar();

  return (
    <div
      className="fixed inset-0 bg-black/50 z-30 lg:hidden"
      onClick={() => setMobileOpen(false)}
      aria-hidden="true"
    />
  );
}

/**
 * SidebarHeader Component - Top section of sidebar
 */
export interface SidebarHeaderProps extends ComponentPropsWithoutRef<'div'> {
  children?: ReactNode;
}

const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(function SidebarHeader(
  { className, children, ...props },
  ref
) {
  const { collapsed } = useSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        'h-16 flex items-center border-b border-slate-800 [html:not(.dark)_&]:border-slate-200',
        collapsed ? 'px-2 justify-center' : 'px-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * SidebarContent Component - Scrollable content area
 */
export interface SidebarContentProps extends ComponentPropsWithoutRef<'nav'> {
  children?: ReactNode;
}

const SidebarContent = forwardRef<HTMLElement, SidebarContentProps>(function SidebarContent(
  { className, children, ...props },
  ref
) {
  return (
    <nav
      ref={ref}
      className={cn('flex-1 overflow-y-auto py-4', className)}
      {...props}
    >
      {children}
    </nav>
  );
});

/**
 * SidebarFooter Component - Bottom section of sidebar
 */
export interface SidebarFooterProps extends ComponentPropsWithoutRef<'div'> {
  children?: ReactNode;
}

const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(function SidebarFooter(
  { className, children, ...props },
  ref
) {
  const { collapsed } = useSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        'border-t border-slate-800 [html:not(.dark)_&]:border-slate-200 py-4',
        collapsed ? 'px-2' : 'px-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * SidebarToggle Component - Button to toggle collapse state
 */
export interface SidebarToggleProps extends ComponentPropsWithoutRef<'button'> {}

const SidebarToggle = forwardRef<HTMLButtonElement, SidebarToggleProps>(function SidebarToggle(
  { className, ...props },
  ref
) {
  const { collapsed, toggle } = useSidebar();

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      className={cn(
        'p-2 rounded-lg',
        'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
        '[html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:text-slate-900 [html:not(.dark)_&]:hover:bg-slate-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500',
        'transition-colors',
        className
      )}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!collapsed}
      {...props}
    >
      <svg
        className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
        />
      </svg>
    </button>
  );
});

/**
 * MobileMenuButton Component - Button to open mobile sidebar
 */
export interface MobileMenuButtonProps extends ComponentPropsWithoutRef<'button'> {}

const MobileMenuButton = forwardRef<HTMLButtonElement, MobileMenuButtonProps>(function MobileMenuButton(
  { className, ...props },
  ref
) {
  const { mobileOpen, toggleMobile } = useSidebar();

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggleMobile}
      className={cn(
        'lg:hidden p-2 rounded-lg',
        'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
        '[html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:text-slate-900 [html:not(.dark)_&]:hover:bg-slate-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500',
        'transition-colors',
        className
      )}
      aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={mobileOpen}
      {...props}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        {mobileOpen ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        )}
      </svg>
    </button>
  );
});

/**
 * MainContent Component - Main content area
 */
export interface MainContentProps extends ComponentPropsWithoutRef<'div'> {
  children?: ReactNode;
}

const MainContent = forwardRef<HTMLDivElement, MainContentProps>(function MainContent(
  { className, children, ...props },
  ref
) {
  const { collapsed } = useSidebar();

  return (
    <div
      ref={ref}
      className={cn(mainContentVariants({ collapsed }), className)}
      role="presentation"
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * DashboardLayout Component - Ember Noir Design System
 *
 * Dashboard layout with collapsible sidebar and responsive behavior.
 * Provides SidebarContext for child components to access collapse state.
 *
 * @example
 * <DashboardLayout
 *   sidebar={
 *     <DashboardLayout.Sidebar>
 *       <DashboardLayout.SidebarHeader>Logo</DashboardLayout.SidebarHeader>
 *       <DashboardLayout.SidebarContent>Nav items</DashboardLayout.SidebarContent>
 *       <DashboardLayout.SidebarFooter>
 *         <DashboardLayout.SidebarToggle />
 *       </DashboardLayout.SidebarFooter>
 *     </DashboardLayout.Sidebar>
 *   }
 * >
 *   <DashboardLayout.Main>Content</DashboardLayout.Main>
 * </DashboardLayout>
 */
export interface DashboardLayoutProps extends ComponentPropsWithoutRef<'div'> {
  defaultCollapsed?: boolean;
  sidebar?: ReactNode;
  children?: ReactNode;
}

type DashboardLayoutComponent = React.ForwardRefExoticComponent<
  DashboardLayoutProps & React.RefAttributes<HTMLDivElement>
> & {
  Sidebar: typeof Sidebar;
  SidebarHeader: typeof SidebarHeader;
  SidebarContent: typeof SidebarContent;
  SidebarFooter: typeof SidebarFooter;
  SidebarToggle: typeof SidebarToggle;
  MobileMenuButton: typeof MobileMenuButton;
  Main: typeof MainContent;
};

const DashboardLayout = forwardRef<HTMLDivElement, DashboardLayoutProps>(function DashboardLayout(
  {
    defaultCollapsed = false,
    sidebar,
    className,
    children,
    ...props
  },
  ref
) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const contextValue = {
    collapsed,
    setCollapsed,
    toggle,
    mobileOpen,
    setMobileOpen,
    toggleMobile,
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={cn('relative', className)}
        {...props}
      >
        {sidebar}
        {children}
      </div>
    </SidebarContext.Provider>
  );
});

// Attach sub-components for namespace pattern
(DashboardLayout as DashboardLayoutComponent).Sidebar = Sidebar;
(DashboardLayout as DashboardLayoutComponent).SidebarHeader = SidebarHeader;
(DashboardLayout as DashboardLayoutComponent).SidebarContent = SidebarContent;
(DashboardLayout as DashboardLayoutComponent).SidebarFooter = SidebarFooter;
(DashboardLayout as DashboardLayoutComponent).SidebarToggle = SidebarToggle;
(DashboardLayout as DashboardLayoutComponent).MobileMenuButton = MobileMenuButton;
(DashboardLayout as DashboardLayoutComponent).Main = MainContent;

export {
  DashboardLayout,
  useSidebar,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarToggle,
  MobileMenuButton,
  MainContent,
  sidebarVariants,
  mainContentVariants,
};
export default DashboardLayout;
