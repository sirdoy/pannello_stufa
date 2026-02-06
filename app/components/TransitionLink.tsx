'use client';

import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { usePageTransition } from '@/app/context/PageTransitionContext';
import { ReactNode, MouseEvent } from 'react';

interface TransitionLinkProps extends Omit<LinkProps, 'onClick'> {
  children: ReactNode;
  transitionType?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * TransitionLink - Enhanced Next.js Link with page transitions
 *
 * Usage:
 * ```jsx
 * import TransitionLink from '@/app/components/TransitionLink';
 *
 * // Default transition (slide-morph)
 * <TransitionLink href="/stove">Go to Stove</TransitionLink>
 *
 * // Custom transition type
 * <TransitionLink href="/stove" transitionType="ember-burst">
 *   Go to Stove with Ember Burst
 * </TransitionLink>
 *
 * // All Link props are supported
 * <TransitionLink
 *   href="/stove"
 *   className="btn-ember"
 *   prefetch={true}
 * >
 *   Go to Stove
 * </TransitionLink>
 * ```
 *
 * Features:
 * - Automatic page transitions
 * - Support for all Next.js Link props
 * - Custom transition types per link
 * - Prefetching support
 * - Accessibility (respects prefers-reduced-motion)
 */
export default function TransitionLink({
  href,
  children,
  transitionType,
  className = '',
  style,
  onClick,
  prefetch,
  replace,
  scroll,
  shallow,
  ...restProps
}: TransitionLinkProps) {
  const router = useRouter();
  const { startTransition, setTransitionType } = usePageTransition() as any;

  const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    // Call custom onClick if provided
    onClick?.(e);

    if (e.defaultPrevented) {
      return;
    }
    // Don't intercept:
    // - Cmd/Ctrl clicks (open in new tab)
    // - External links
    // - Anchor links on same page
    const isModifiedEvent = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    const isExternalLink = href.toString().startsWith('http');
    const isSamePageAnchor = href.toString().startsWith('#');

    if (isModifiedEvent || isExternalLink || isSamePageAnchor) {
      return;
    }

    // Prevent default navigation
    e.preventDefault();

    // Set custom transition type if provided
    if (transitionType) {
      setTransitionType(transitionType);
    }

    // Start transition and navigate
    startTransition(() => {
      if (replace) {
        router.replace(href.toString());
      } else {
        router.push(href.toString());
      }
    });
  };

  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={handleClick}
      prefetch={prefetch}
      {...restProps}
    >
      {children}
    </Link>
  );
}
