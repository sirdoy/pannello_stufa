'use client';

import { useEffect, useState } from 'react';

/**
 * Template — page transition wrapper.
 *
 * Each navigation re-mounts this template (Next App Router convention),
 * giving us a clean point to run a CSS fade-in on the new page.
 *
 * Previously this also called `document.startViewTransition()` to add native
 * cross-fade in Chromium. That branch was removed: setMounted(true) inside the
 * View Transition callback raced React's commit — the browser snapshotted both
 * before/after with the wrapper still at opacity-0, logged "Transition was
 * skipped", and under rapid navigation occasionally left the wrapper stuck at
 * opacity-0 (page goes fully black until refresh). The CSS fallback alone is
 * deterministic and good enough; restoring native cross-fade can be revisited
 * via React 19's <ViewTransition> primitive when stable.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    // Reset scroll position on page navigation.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Single rAF tick before flipping mounted=true — gives the browser one
    // paint at opacity-0 so the CSS transition has something to animate from.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`transition-all duration-500 transition-page-smooth ${
        mounted
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-[0.98]'
      }`}
    >
      {children}
    </div>
  );
}
