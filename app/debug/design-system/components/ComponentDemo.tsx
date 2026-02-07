'use client';

import { ReactNode } from 'react';
import CodeBlock from './CodeBlock';

interface ComponentDemoProps {
  code: string;
  language?: string;
  children: ReactNode;
  className?: string;
}

/**
 * ComponentDemo Component - Design System Documentation
 *
 * Side-by-side layout showing code example and live preview.
 * Code displayed on left (desktop) or bottom (mobile).
 * Preview displayed on right (desktop) or top (mobile).
 * Styled to match Ember Noir design system.
 *
 * @example
 * <ComponentDemo code={`<Button variant="ember">Click me</Button>`}>
 *   <Button variant="ember">Click me</Button>
 * </ComponentDemo>
 */
export default function ComponentDemo({
  code,
  language = 'jsx',
  children,
  className = '',
}: ComponentDemoProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className}`}>
      {/* Code block - second on mobile, first on desktop */}
      <div className="order-2 lg:order-1">
        <CodeBlock code={code} language={language} />
      </div>

      {/* Preview - first on mobile, second on desktop */}
      <div className="order-1 lg:order-2">
        <div className="h-full p-6 bg-slate-900/50 rounded-2xl border border-white/[0.06] flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
