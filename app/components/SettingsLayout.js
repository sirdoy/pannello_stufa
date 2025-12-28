'use client';

import { useRouter } from 'next/navigation';
import Button from './ui/Button';

/**
 * SettingsLayout - Unified layout wrapper for all settings pages
 *
 * Provides:
 * - Consistent full-page background with dark mode support
 * - Consistent padding and max-width container
 * - Optional back button
 * - Consistent header styling
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.title - Page title
 * @param {string} [props.icon] - Optional emoji icon for title
 * @param {boolean} [props.showBackButton=true] - Show back button
 * @param {string} [props.backHref] - Custom back navigation path (defaults to browser back)
 */
export default function SettingsLayout({
  children,
  title,
  icon,
  showBackButton = true,
  backHref
}) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with optional back button */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              liquid
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex-shrink-0"
              aria-label="Torna indietro"
            >
              ← Indietro
            </Button>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            {icon && <span className="text-3xl sm:text-4xl">{icon}</span>}
            {title}
          </h1>
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
