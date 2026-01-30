'use client';

import CodeBlock from './CodeBlock';

/**
 * ComponentDemo Component - Design System Documentation
 *
 * Side-by-side layout showing code example and live preview.
 * Code displayed on left (desktop) or bottom (mobile).
 * Preview displayed on right (desktop) or top (mobile).
 * Styled to match Ember Noir design system.
 *
 * @param {Object} props - Component props
 * @param {string} props.code - Code string to display in CodeBlock
 * @param {string} [props.language='jsx'] - Programming language for syntax highlighting
 * @param {React.ReactNode} props.children - Live preview content
 * @param {string} [props.className] - Additional CSS classes
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
}) {
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
