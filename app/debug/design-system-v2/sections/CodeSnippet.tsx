'use client';
/**
 * CodeSnippet — Phase 182 (D-18, D-19)
 *
 * Renders a <pre><code> block plus a top-right "Copia" Pressable that copies
 * the snippet to clipboard. After a successful copy, the button label flips to
 * "Copiato" for 1500ms then reverts. Clipboard failures (rare in modern
 * browsers) are caught silently — no toast, no error UI (D-04).
 *
 * Italian visible copy ("Copia" / "Copiato"); aria fallback also Italian since
 * the page is dev-only and Italian-first.
 */
import React, { useState } from 'react';
import { Pressable } from '@/app/components/EmberGlass';

export interface CodeSnippetProps {
  code: string;
}

export function CodeSnippet({ code }: CodeSnippetProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = (): void => {
    try {
      const writePromise = navigator.clipboard?.writeText(code);
      if (writePromise && typeof writePromise.then === 'function') {
        writePromise
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => {
            // D-04: clipboard rejected (permission/denied) — silent noop.
          });
      }
    } catch {
      // D-04: navigator.clipboard unavailable — silent noop.
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <pre
        style={{
          fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
          fontSize: 12,
          fontWeight: 400,
          color: 'var(--text-2)',
          background: 'var(--glass-bg)',
          border: '0.5px solid var(--glass-border)',
          borderRadius: 8,
          padding: 12,
          margin: 0,
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
        }}
      >
        <code>{code}</code>
      </pre>
      <Pressable
        as="button"
        type="button"
        aria-label={copied ? 'Copiato' : 'Copia'}
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          height: 28,
          padding: '0 10px',
          borderRadius: 8,
          border: '0.5px solid var(--glass-border)',
          background: 'rgba(255,255,255,0.06)',
          color: 'var(--text-2)',
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        {copied ? 'Copiato' : 'Copia'}
      </Pressable>
    </div>
  );
}
