'use client';

import { useRouter } from 'next/navigation';
import Button from './ui/Button';
import Heading from './ui/Heading';
import { ReactNode } from 'react';

interface SettingsLayoutProps {
  children: ReactNode;
  title: string;
  icon?: string;
  showBackButton?: boolean;
  backHref?: string;
}

/**
 * SettingsLayout - Unified layout wrapper for all settings pages
 *
 * Provides:
 * - Consistent full-page background with dark mode support
 * - Consistent padding and max-width container
 * - Optional back button
 * - Consistent header styling
 */
export default function SettingsLayout({
  children,
  title,
  icon,
  showBackButton = true,
  backHref
}: SettingsLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 [html:not(.dark)_&]:from-slate-50 [html:not(.dark)_&]:via-white [html:not(.dark)_&]:to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with optional back button */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex-shrink-0"
              aria-label="Torna indietro"
            >
              ← Indietro
            </Button>
          )}
          <Heading level={1} className="flex items-center gap-2">
            {icon && <span className="text-3xl sm:text-4xl">{icon}</span>}
            {title}
          </Heading>
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
