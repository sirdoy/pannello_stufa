'use client';
/**
 * Sheet — Phase 175 (SHEET-01) — Ember Glass primitive
 *
 * Z-INDEX RESERVATION (Phase 175 contract; downstream phases 178-181 must respect):
 *   200 → Sheet backdrop
 *   201 → Sheet container
 * Bottom-tab bar (Phase 181 NAV-01..04), dashboard cards (Phase 177), and any other
 * stacked content MUST stay below 200 so this Sheet hides them cleanly when open.
 *
 * Composition: prop-driven facade <Sheet open onClose title> over Radix Dialog.
 *   Radix owns: focus trap, ESC, return-focus on close, role/aria-modal.
 *   We own:     visual surface (matches design bundle sheets.jsx:13-65), backdrop tap
 *               dismissal (own div + onClick={onClose}; Radix's onPointerDownOutside
 *               is suppressed via e.preventDefault to avoid double-fire), and body
 *               scroll-lock (lifted from BottomSheet.tsx:50-67 — restores scrollY on
 *               close, which Radix's built-in scroll-lock does not).
 *
 * forceMount on Portal AND Content keeps the subtree alive across open=false so the
 * 400ms outro transition plays (Radix unmounts immediately by default).
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/sheets.jsx:13-65
 *
 * The single intentional deviation from the bundle is `position: fixed` (the bundle
 * uses `absolute` because it sits inside a fake-iPhone frame; we render in the real
 * document so the backdrop and container must be viewport-anchored).
 */

import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';

import { incrementSheetCount, decrementSheetCount } from './SheetCounter';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps): ReactElement {
  // Body scroll-lock + restore — recipe duplicated from app/components/ui/BottomSheet.tsx:50-67.
  // Captured scrollY persists in a ref so the cleanup uses the same value even under
  // React 18 Strict Mode double-mount (Pitfall 5 in 175-RESEARCH.md).
  const lockedScrollY = useRef<number>(0);
  useEffect(() => {
    if (!open) return;
    lockedScrollY.current = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY.current}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    incrementSheetCount();        // ← NEW (Phase 181 D-10)
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, lockedScrollY.current);
      decrementSheetCount();      // ← NEW (Phase 181 D-10)
    };
  }, [open]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      {/* forceMount on Portal removed too: it propagates to Content via portalContext
          so leaving it on would re-mount Content even with forceMount={undefined} on
          Content itself. With Portal unmounted when closed, the outro fade on the
          custom backdrop is also lost; acceptable for now. Recoverable via CSS
          animation on [data-state='closed']. */}
      <DialogPrimitive.Portal>
        {/* Custom backdrop — owns the click-to-dismiss vector (D-10).
            Tagged data-sheet-backdrop="true" so unit + Playwright tests can target it. */}
        <div
          data-sheet-backdrop="true"
          aria-hidden="true"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: open ? 'rgba(0,0,0,0.5)' : 'transparent', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:20
            backdropFilter: open ? 'blur(8px)' : 'none', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:21
            WebkitBackdropFilter: open ? 'blur(8px)' : 'none',
            transition: 'background .3s, backdrop-filter .3s',
            pointerEvents: open ? 'auto' : 'none',
          }}
        />
        <DialogPrimitive.Content
          // forceMount removed: Radix DialogContentModal calls hideOthers() on mount
          // which sets aria-hidden + pointer-events:none on the rest of the page —
          // even when open=false. With forceMount, this fires on initial render and
          // never unwinds, leaving the page inert. Outro animation degrades (sheet
          // closes instantly); recoverable later via CSS animation on
          // [data-state='closed'] which Radix Presence honors.
          onPointerDownOutside={(e) => e.preventDefault()}
          // Block Radix's onCloseAutoFocus: it returns focus to the trigger
          // button via element.focus() which scrolls the trigger into view,
          // overriding the scroll-lock restore in our [open] useEffect cleanup
          // and dropping the user wherever the trigger lives in the page.
          // Browser default-focuses body on Content unmount, which is enough.
          onCloseAutoFocus={(e) => e.preventDefault()}
          // Suppress Radix's missing-description console warning (UI-SPEC line 524).
          aria-describedby={undefined}
          style={{
            position: 'fixed',
            left: 8,
            right: 8,
            bottom: 8,
            zIndex: 201,
            borderRadius: 32,
            background: 'rgba(28, 25, 23, 0.85)', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:31
            backdropFilter: 'blur(40px) saturate(200%)', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:32
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '0.5px solid rgba(255,255,255,0.12)', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:34
            boxShadow:
              '0 -20px 60px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.08)', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:35
            padding: '10px 20px 30px',
            maxHeight: '85%',
            overflowY: 'auto',
            transform: open ? 'translateY(0)' : 'translateY(110%)',
            transition: 'transform .4s cubic-bezier(.22,1,.36,1)',
          }}
        >
          {/* Grabber — always rendered (D-09). */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 12px' }}>
            <div
              style={{
                width: 40,
                height: 5,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.2)', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:44
              }}
            />
          </div>
          {/* Title row + close button when title prop is set; otherwise VisuallyHidden
              fallback to satisfy Radix a11y requirement (Pitfall 3 in 175-RESEARCH.md). */}
          {title ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}
            >
              <DialogPrimitive.Title
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#fff', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:39
                  margin: 0,
                }}
              >
                {title}
              </DialogPrimitive.Title>
              <button
                type="button"
                data-sheet-close="true"
                aria-label="Chiudi"
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:53
                  color: '#fff', // AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:55
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>
          ) : (
            <VisuallyHidden asChild>
              <DialogPrimitive.Title>Sheet</DialogPrimitive.Title>
            </VisuallyHidden>
          )}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
