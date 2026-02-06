'use client';

import type React from 'react';
import { forwardRef } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import Heading from './Heading';
import Text from './Text';

/**
 * PageLayout Variants - CVA Configuration
 *
 * maxWidth: sm, md, lg, xl, 2xl, full
 * padding: none, sm, md, lg
 */
const pageLayoutVariants = cva(
  // Base classes - no min-h-screen since body already handles it
  // no padding since layout.js main already provides px-4 sm:px-6 lg:px-8
  'flex flex-col',
  {
    variants: {
      maxWidth: {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md',
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-screen-2xl',
        '7xl': 'max-w-7xl',
        full: 'max-w-full',
        none: '', // No max-width constraint
      },
      padding: {
        none: '',
        sm: 'px-4',
        md: 'px-4 sm:px-6',
        lg: 'px-4 sm:px-6 lg:px-8',
      },
    },
    defaultVariants: {
      maxWidth: 'none', // Don't constrain by default - layout.js already does max-w-7xl
      padding: 'none', // Don't add padding by default - layout.js main already has it
    },
  }
);

export interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** Action buttons */
  actions?: React.ReactNode;
  /** Custom children (overrides structured content) */
  children?: React.ReactNode;
}

/**
 * PageHeader Component - Header slot for PageLayout
 *
 * Renders title, description, and optional actions.
 */
const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(function PageHeader(
  {
    title,
    description,
    actions,
    className,
    children,
    ...props
  },
  ref
) {
  // If children are provided, render them instead of structured content
  if (children) {
    return (
      <header
        ref={ref}
        className={cn('py-6 sm:py-8', className)}
        {...props}
      >
        {children}
      </header>
    );
  }

  return (
    <header
      ref={ref}
      className={cn('py-6 sm:py-8', className)}
      {...props}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {title && (
            <Heading level={1} size="2xl">
              {title}
            </Heading>
          )}
          {description && (
            <Text variant="secondary" className="max-w-2xl">
              {description}
            </Text>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
});

export interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content */
  children?: React.ReactNode;
}

/**
 * PageContent Component - Content slot for PageLayout
 *
 * Main content area with flexible growth.
 */
const PageContent = forwardRef<HTMLDivElement, PageContentProps>(function PageContent(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn('flex-1 py-6', className)}
      role="presentation"
      {...props}
    >
      {children}
    </div>
  );
});

export interface PageFooterProps extends React.HTMLAttributes<HTMLElement> {
  /** Footer content */
  children?: React.ReactNode;
}

/**
 * PageFooter Component - Footer slot for PageLayout
 *
 * Optional footer with consistent styling.
 */
const PageFooter = forwardRef<HTMLElement, PageFooterProps>(function PageFooter(
  { className, children, ...props },
  ref
) {
  return (
    <footer
      ref={ref}
      className={cn(
        'py-6 border-t border-slate-800 [html:not(.dark)_&]:border-slate-200',
        className
      )}
      {...props}
    >
      {children}
    </footer>
  );
});

export interface PageLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageLayoutVariants> {
  /** Header slot (typically PageHeader) */
  header?: React.ReactNode;
  /** Footer slot (optional, typically PageFooter) */
  footer?: React.ReactNode;
  /** Center content horizontally */
  centered?: boolean;
  /** Page content */
  children?: React.ReactNode;
}

/**
 * PageLayout Component - Ember Noir Design System
 *
 * Consistent page structure with header, content, and footer slots.
 * Provides responsive max-width and padding configurations.
 *
 * @example
 * <PageLayout
 *   header={
 *     <PageLayout.Header
 *       title="Dashboard"
 *       description="Overview of your devices"
 *       actions={<Button>Add Device</Button>}
 *     />
 *   }
 *   footer={<PageLayout.Footer>Footer content</PageLayout.Footer>}
 * >
 *   <main content />
 * </PageLayout>
 */
const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(function PageLayout(
  {
    header,
    footer,
    maxWidth, // Default handled by CVA: 'none'
    padding, // Default handled by CVA: 'none'
    centered = true,
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        pageLayoutVariants({ maxWidth, padding }),
        centered && 'mx-auto',
        className
      )}
      {...props}
    >
      {header}
      <PageContent>{children}</PageContent>
      {footer}
    </div>
  );
});

// Type the PageLayout namespace with sub-components
type PageLayoutComponent = typeof PageLayout & {
  Header: typeof PageHeader;
  Content: typeof PageContent;
  Footer: typeof PageFooter;
};

// Attach sub-components for namespace pattern
(PageLayout as PageLayoutComponent).Header = PageHeader;
(PageLayout as PageLayoutComponent).Content = PageContent;
(PageLayout as PageLayoutComponent).Footer = PageFooter;

export { PageLayout, pageLayoutVariants, PageHeader, PageContent, PageFooter };
export default PageLayout as PageLayoutComponent;
