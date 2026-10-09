'use client';

import type { ReactNode } from 'react';
import { PageHeader } from './EmberGlass/PageHeader';

interface SettingsLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  showBackButton?: boolean;
  backHref?: string;
}

/**
 * SettingsLayout - Layout wrapper for settings / registry pages
 *
 * Provides the shared EmberGlass page header (back button to the parent
 * route, "Altro" by default) and a centred column for the page content.
 */
export default function SettingsLayout({
  children,
  title,
  description,
  showBackButton = true,
  backHref = '/altro',
}: SettingsLayoutProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={title} description={description} backHref={showBackButton ? backHref : undefined} />
      {children}
    </div>
  );
}
