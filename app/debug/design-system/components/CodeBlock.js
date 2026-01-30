'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Button from '@/app/components/ui/Button';

/**
 * CodeBlock Component - Design System Documentation
 *
 * Syntax-highlighted code block with copy-to-clipboard functionality.
 * Uses react-syntax-highlighter with VS Code Dark+ theme.
 * Styled to match Ember Noir design system.
 *
 * @param {Object} props - Component props
 * @param {string} props.code - Code string to display
 * @param {string} [props.language='jsx'] - Programming language for syntax highlighting
 * @param {boolean} [props.showLineNumbers=true] - Show line numbers
 * @param {string} [props.className] - Additional CSS classes
 *
 * @example
 * <CodeBlock
 *   code={`<Button variant="ember">Click me</Button>`}
 *   language="jsx"
 * />
 */
export default function CodeBlock({
  code,
  language = 'jsx',
  showLineNumbers = true,
  className = '',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Custom style overrides for Ember Noir
  const customStyle = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      background: 'transparent',
      margin: 0,
      padding: '1rem',
      fontSize: '0.875rem',
      lineHeight: '1.5',
    },
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      background: 'transparent',
      fontSize: '0.875rem',
    },
  };

  return (
    <div
      className={`relative rounded-xl bg-slate-900/80 border border-white/[0.06] overflow-hidden ${className}`}
    >
      {/* Copy button */}
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
          className="text-xs px-2 py-1 min-h-[32px] bg-slate-800/50 hover:bg-slate-700/50"
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      {/* Syntax highlighted code */}
      <SyntaxHighlighter
        language={language}
        style={customStyle}
        showLineNumbers={showLineNumbers}
        wrapLines
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: 'rgba(148, 163, 184, 0.4)',
          userSelect: 'none',
        }}
        customStyle={{
          background: 'transparent',
          padding: 0,
          margin: 0,
        }}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  );
}
