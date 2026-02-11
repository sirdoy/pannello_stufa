'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Text from '@/app/components/ui/Text';
import Heading from '@/app/components/ui/Heading';
import { getConsentState, setConsentState } from '@/lib/analyticsConsentService';

/**
 * ConsentBanner Component
 *
 * GDPR-compliant consent banner that shows on first visit.
 * Enforces visual parity between Accept and Reject buttons per EU 2026 requirements.
 *
 * Features:
 * - Shows only when consent state is 'unknown'
 * - Accept and Reject buttons are visually identical (same variant, same size)
 * - Consent state persisted to localStorage via analyticsConsentService
 * - Non-blocking: overlays but doesn't prevent page use
 * - Essential controls work regardless of consent state
 *
 * GDPR Compliance:
 * - No pre-ticked options or implied consent
 * - No dark patterns (both buttons have equal visual weight)
 * - Explicit mention that essential controls work without consent
 * - User must make explicit choice
 */
export default function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check consent state on mount (client-side only)
    if (getConsentState() === 'unknown') {
      setShow(true);
    }
  }, []);

  const handleConsent = (granted: boolean) => {
    // Save consent decision
    setConsentState(granted);

    // Hide banner
    setShow(false);

    // Soft reload to activate analytics features if granted
    // This ensures analytics scripts/APIs are initialized
    if (granted) {
      window.location.reload();
    }
  };

  // Don't render if consent already decided
  if (!show) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] md:max-w-lg md:mx-auto">
      <Card variant="glass" padding>
        <Heading level={4} variant="default" className="mb-2">
          Analytics & Usage Statistics
        </Heading>
        <Text variant="secondary" size="sm" className="mb-4">
          We track stove usage to show you consumption statistics, pellet estimates, and weather correlations. Essential stove controls work without consent.
        </Text>
        <div className="flex gap-3">
          {/* GDPR Visual Parity: identical variant, identical size */}
          <Button
            variant="subtle"
            size="sm"
            onClick={() => handleConsent(false)}
            className="flex-1"
            aria-label="Reject analytics tracking"
          >
            Only Essential
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => handleConsent(true)}
            className="flex-1"
            aria-label="Accept analytics tracking"
          >
            Accept Analytics
          </Button>
        </div>
      </Card>
    </div>
  );
}
