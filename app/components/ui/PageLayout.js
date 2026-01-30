'use client';

import { forwardRef } from 'react';
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

/**
 * PageHeader Component - Header slot for PageLayout
 *
 * Renders title, description, and optional actions.
 */
const PageHeader = forwardRef(function PageHeader(
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

/**
 * PageContent Component - Content slot for PageLayout
 *
 * Main content area with flexible growth.
 */
const PageContent = forwardRef(function PageContent(
  { className, children, ...props },
  ref
) {
  return (
    <main
      ref={ref}
      className={cn('flex-1 py-6', className)}
      {...props}
    >
      {children}
    </main>
  );
});

/**
 * PageFooter Component - Footer slot for PageLayout
 *
 * Optional footer with consistent styling.
 */
const PageFooter = forwardRef(function PageFooter(
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

/**
 * PageLayout Component - Ember Noir Design System
 *
 * Consistent page structure with header, content, and footer slots.
 * Provides responsive max-width and padding configurations.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.header - Header slot (typically PageHeader)
 * @param {ReactNode} props.footer - Footer slot (optional, typically PageFooter)
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'|'full'} props.maxWidth - Maximum content width
 * @param {'none'|'sm'|'md'|'lg'} props.padding - Horizontal padding
 * @param {boolean} props.centered - Center content horizontally
 * @param {ReactNode} props.children - Page content
 * @param {string} props.className - Additional classes
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
const PageLayout = forwardRef(function PageLayout(
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

// Attach sub-components for namespace pattern
PageLayout.Header = PageHeader;
PageLayout.Content = PageContent;
PageLayout.Footer = PageFooter;

export { PageLayout, pageLayoutVariants, PageHeader, PageContent, PageFooter };
export default PageLayout;
