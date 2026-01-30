# Phase 18: Documentation & Polish - Research

**Researched:** 2026-01-30
**Domain:** Component documentation, interactive examples, accessibility documentation
**Confidence:** HIGH

## Summary

This phase focuses on completing the design system documentation by creating comprehensive component API references, interactive examples with copy-to-clipboard functionality, and detailed accessibility documentation. The research identifies best practices for modern React/Next.js component documentation in 2026, focusing on self-hosted solutions that match the project's single-developer, internal-use context.

Key findings:
- **Self-hosted documentation** (custom Next.js pages) is simpler and more maintainable than Storybook for single-developer projects
- **Navigator Clipboard API** is the modern, reliable method for copy-to-clipboard (replaces deprecated execCommand)
- **react-syntax-highlighter** with Prism.js is the standard for JSX syntax highlighting
- **Per-component accessibility sections** should document ARIA roles, keyboard interactions, and screen reader announcements
- The existing `/debug/design-system` page already has excellent structure - expand it rather than rewrite

**Primary recommendation:** Enhance the existing `/debug/design-system` page with interactive code examples (with copy buttons and syntax highlighting), comprehensive prop tables, and per-component accessibility documentation. Update `docs/design-system.md` to reference the live examples.

## Standard Stack

The established libraries/tools for component documentation in Next.js 15.5:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-syntax-highlighter | 15.5+ | JSX syntax highlighting | Industry standard, Prism.js integration, supports JSX out-of-box |
| Navigator Clipboard API | Native | Copy to clipboard | Modern browser API, replaces deprecated execCommand |
| jest-axe | 9+ | Accessibility testing | Already in project, verifies WCAG compliance |
| Radix UI | Current | Accessible primitives | Already used (Tooltip, Checkbox, etc.), provides ARIA patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| prismjs/themes | 1.29+ | Syntax themes | Import dark theme for Ember Noir consistency |
| @radix-ui/react-tooltip | Current | Interactive docs tooltips | Show additional info without cluttering |
| class-variance-authority | 0.7+ | Variant documentation | Already used, show CVA config examples |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Storybook | Custom Next.js pages | Storybook adds complexity (build config, maintenance), custom pages simpler for single developer |
| Docusaurus | Next.js /debug pages | Docusaurus is separate site, Next.js pages integrated with existing app |
| Highlight.js | Prism.js | Prism lighter (2KB vs 12KB), better JSX support |

**Installation:**
```bash
npm install react-syntax-highlighter
npm install --save-dev @types/react-syntax-highlighter  # if using TypeScript
```

## Architecture Patterns

### Recommended Project Structure
```
app/debug/design-system/
├── page.js                    # Main showcase (already exists)
├── components/
│   ├── CodeBlock.js          # Syntax highlighted code with copy button
│   ├── ComponentDemo.js      # Side-by-side code + preview
│   ├── PropTable.js          # Component API table
│   └── AccessibilitySection.js  # A11y documentation block
└── data/
    └── component-docs.js     # Centralized component metadata

docs/
├── design-system.md          # Written reference (already exists)
└── accessibility.md          # Centralized a11y guide (NEW)
```

### Pattern 1: Interactive Code Example with Copy Button
**What:** Code snippet with syntax highlighting and one-click copy
**When to use:** Every component example in `/debug/design-system`
**Example:**
```javascript
// Source: https://www.creative-tim.com/learning-lab/nextjs/react-copy-to-clipboard/argon-dashboard
'use client';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

function CodeBlock({ code, language = 'jsx' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
        aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      >
        {copied ? '✓ Copied' : '📋 Copy'}
      </button>
      <SyntaxHighlighter language={language} style={vscDarkPlus}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
```

### Pattern 2: Side-by-Side Component Demo
**What:** Code on left, rendered component on right
**When to use:** Interactive examples where users can see live behavior
**Example:**
```jsx
function ComponentDemo({ code, children }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="order-2 lg:order-1">
        <CodeBlock code={code} />
      </div>
      <div className="order-1 lg:order-2 p-6 bg-slate-900/50 rounded-2xl border border-white/[0.06]">
        {children}
      </div>
    </div>
  );
}
```

### Pattern 3: Component Props Table
**What:** Auto-generated table from component prop documentation
**When to use:** API reference section for each component
**Example:**
```jsx
function PropTable({ component }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/[0.06]">
          <th className="text-left py-3">Prop</th>
          <th className="text-left py-3">Type</th>
          <th className="text-left py-3">Default</th>
          <th className="text-left py-3">Description</th>
        </tr>
      </thead>
      <tbody>
        {component.props.map(prop => (
          <tr key={prop.name} className="border-b border-white/[0.03]">
            <td className="py-3 font-mono text-ember-400">{prop.name}</td>
            <td className="py-3 font-mono text-ocean-400">{prop.type}</td>
            <td className="py-3 font-mono text-slate-400">{prop.default || '-'}</td>
            <td className="py-3 text-slate-300">{prop.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Pattern 4: Accessibility Documentation Block
**What:** Per-component a11y section documenting keyboard, ARIA, screen reader
**When to use:** Every interactive component
**Example:**
```jsx
function AccessibilitySection({ component }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Heading level={4} variant="ocean" className="mb-4">
          ♿ Accessibility
        </Heading>

        {/* Keyboard Navigation */}
        <div className="mb-4">
          <Text variant="label" size="xs" className="mb-2">Keyboard Navigation</Text>
          <table className="w-full text-sm">
            <tbody>
              {component.keyboard.map(k => (
                <tr key={k.key}>
                  <td className="py-1 pr-4">
                    <Badge variant="neutral" size="sm">{k.key}</Badge>
                  </td>
                  <td className="py-1 text-slate-300">{k.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ARIA Attributes */}
        <div className="mb-4">
          <Text variant="label" size="xs" className="mb-2">ARIA Attributes</Text>
          <div className="space-y-1">
            {component.aria.map(a => (
              <Text key={a.attr} variant="tertiary" size="sm" mono>
                {a.attr}: {a.description}
              </Text>
            ))}
          </div>
        </div>

        {/* Screen Reader Announcements */}
        <div>
          <Text variant="label" size="xs" className="mb-2">Screen Reader</Text>
          <Text variant="secondary" size="sm">{component.screenReader}</Text>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Anti-Patterns to Avoid
- **Don't duplicate content**: Link between `/debug/design-system` and `docs/design-system.md` rather than maintaining identical content in two places
- **Don't hardcode examples**: Extract code examples to strings/variables so copy button copies the exact code shown
- **Don't skip accessibility**: Every interactive component MUST document keyboard navigation and ARIA
- **Don't use raw HTML in examples**: Show best practices (use Heading, Text, Button components, not h1, p, button)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom regex parser | react-syntax-highlighter | Handles JSX, imports, themes, edge cases (nested quotes, comments) |
| Copy to clipboard | document.execCommand | Navigator Clipboard API | execCommand deprecated, Clipboard API handles permissions, async, secure contexts |
| Code formatting | Manual string manipulation | Template literals with proper indentation | Preserves formatting, easier to maintain |
| A11y testing | Manual keyboard testing only | jest-axe + manual testing | jest-axe catches WCAG violations automated tests can find, manual tests catch UX issues |
| Prop type extraction | Manual documentation | JSDoc comments + extraction script | Single source of truth, auto-generate tables |

**Key insight:** Documentation tools should be simple and maintainable. For a single-developer project, custom Next.js pages are easier than Storybook's build complexity. Focus on content quality over tooling sophistication.

## Common Pitfalls

### Pitfall 1: Copy Button Copies Wrong Code
**What goes wrong:** Copy button copies a different version of code than what's displayed (e.g., minified vs formatted)
**Why it happens:** Code example and copy source are separate strings
**How to avoid:**
- Store code as a single source string
- Use same string for both syntax highlighter and clipboard
- Test copy button by pasting into editor
**Warning signs:** Users report "copied code doesn't work" or "code looks different when pasted"

### Pitfall 2: Accessibility Documentation Out of Sync
**What goes wrong:** Component behavior changes but a11y docs not updated
**Why it happens:** Accessibility section is separate from component code
**How to avoid:**
- Document keyboard shortcuts as constants in component file
- Extract ARIA patterns to shared docs referenced by both component and documentation
- Add test that fails if keyboard shortcuts change without updating docs
**Warning signs:** Keyboard shortcuts listed in docs don't match actual component behavior

### Pitfall 3: Code Examples Don't Follow Best Practices
**What goes wrong:** Documentation shows anti-patterns (raw HTML, inline styles, deprecated props)
**Why it happens:** Examples written quickly without review
**How to avoid:**
- Every code example should be lintable/testable
- Use actual component imports in examples (don't fake it)
- Run examples through same lint rules as production code
**Warning signs:** Users copy examples and get lint errors or broken functionality

### Pitfall 4: Dark/Light Mode Not Documented
**What goes wrong:** Developers don't know component has light mode support, or how variants change between modes
**Why it happens:** Dark mode is primary, light mode added later as override
**How to avoid:**
- Document both modes in color/variant tables
- Show side-by-side examples where behavior differs
- List which props affect light mode styling
**Warning signs:** Questions like "does this work in light mode?" or "why does this look different in light mode?"

### Pitfall 5: Missing Interactive States in Examples
**What goes wrong:** Examples show only default state, not hover, focus, disabled, loading
**Why it happens:** Static screenshots or examples without state management
**How to avoid:**
- Include interactive examples with state (buttons that can be clicked, toggles that switch)
- Document all states in prop table (default, hover, focus, active, disabled, loading)
- Show state transitions in examples (not just final state)
**Warning signs:** Users ask "how do I show loading state?" when it's already in component API

## Code Examples

Verified patterns from official sources:

### Copy to Clipboard with Visual Feedback
```jsx
// Source: https://www.creative-tim.com/learning-lab/nextjs/react-copy-to-clipboard/argon-dashboard
'use client';
import { useState } from 'react';
import Button from '@/app/components/ui/Button';

function CopyButton({ text, children = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      icon={copied ? '✓' : '📋'}
      aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
    >
      {copied ? 'Copied!' : children}
    </Button>
  );
}
```

### JSX Syntax Highlighting with Prism
```jsx
// Source: https://github.com/react-syntax-highlighter/react-syntax-highlighter
'use client';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

function CodeHighlight({ code, language = 'jsx' }) {
  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      customStyle={{
        margin: 0,
        borderRadius: '12px',
        fontSize: '0.875rem',
        lineHeight: '1.5',
      }}
      showLineNumbers
      wrapLines
    >
      {code}
    </SyntaxHighlighter>
  );
}
```

### Component Metadata for Documentation
```javascript
// Source: Best practice pattern from component library documentation
// app/debug/design-system/data/component-docs.js

export const componentDocs = {
  Button: {
    name: 'Button',
    description: 'Primary action button with gradient and multiple variants',
    category: 'Form Controls',
    props: [
      {
        name: 'variant',
        type: "'ember'|'subtle'|'ghost'|'success'|'danger'|'outline'",
        default: "'ember'",
        description: 'Visual style variant',
      },
      {
        name: 'size',
        type: "'sm'|'md'|'lg'",
        default: "'md'",
        description: 'Button size (44px, 48px, 56px min height)',
      },
      {
        name: 'disabled',
        type: 'boolean',
        default: 'false',
        description: 'Disabled state (70% opacity)',
      },
      {
        name: 'loading',
        type: 'boolean',
        default: 'false',
        description: 'Shows spinner overlay, disables interaction',
      },
    ],
    keyboard: [
      { key: 'Enter', action: 'Activates button' },
      { key: 'Space', action: 'Activates button' },
      { key: 'Tab', action: 'Moves focus to/from button' },
    ],
    aria: [
      { attr: 'role="button"', description: 'Implicit from <button> element' },
      { attr: 'aria-disabled', description: 'Set when disabled=true' },
      { attr: 'aria-label', description: 'Required for iconOnly buttons' },
    ],
    screenReader: 'Announces as "Button, [label]". When disabled, adds "dimmed" or "unavailable". When loading, spinner is hidden from screen readers.',
    wcagLevel: 'AA',
    testFile: '__tests__/Button.test.js',
  },
  // ... other components
};
```

### Accessibility Documentation Table
```jsx
// Source: WCAG documentation patterns
function KeyboardShortcutsTable({ shortcuts }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/[0.06]">
          <th className="text-left py-2 text-slate-400 font-medium">Key</th>
          <th className="text-left py-2 text-slate-400 font-medium">Action</th>
        </tr>
      </thead>
      <tbody>
        {shortcuts.map(({ key, action }) => (
          <tr key={key} className="border-b border-white/[0.03]">
            <td className="py-2">
              <Badge variant="neutral" size="sm" className="font-mono">
                {key}
              </Badge>
            </td>
            <td className="py-2 text-slate-300">{action}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| document.execCommand('copy') | Navigator Clipboard API | 2021+ | Async, secure context aware, better error handling |
| Storybook for all docs | Custom Next.js pages | 2024+ | Simpler for small teams, less build complexity |
| Separate docs site | Integrated /debug routes | 2023+ | Live examples, always in sync with codebase |
| Static screenshots | Interactive examples | 2024+ | Users can test behavior, copy exact code |
| Manual a11y docs | jest-axe + manual testing | 2022+ | Automated WCAG checks catch regressions |

**Deprecated/outdated:**
- **document.execCommand**: Deprecated, use Navigator Clipboard API
- **Highlight.js for React**: react-syntax-highlighter with Prism is lighter and better for JSX
- **Separate Storybook deployment**: For single developer, custom Next.js pages simpler
- **Props in separate .md files**: JSDoc comments in component files are single source of truth

## Open Questions

Things that couldn't be fully resolved:

1. **Component metadata extraction automation**
   - What we know: JSDoc comments can document props
   - What's unclear: Whether to auto-generate prop tables from JSDoc or maintain manually
   - Recommendation: Start with manual component-docs.js (simpler), consider automation if maintenance becomes burden

2. **Syntax highlighting theme customization**
   - What we know: vscDarkPlus theme works but may not match Ember Noir exactly
   - What's unclear: Whether to customize Prism theme or use default
   - Recommendation: Start with vscDarkPlus, customize if visual mismatch is noticeable

3. **Migration guide necessity**
   - What we know: User said "Non mi interessa la migration guide" - all code already uses new components
   - What's unclear: N/A - confirmed not needed
   - Recommendation: Skip migration guide entirely per user decision

## Sources

### Primary (HIGH confidence)
- Navigator Clipboard API - https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API (MDN official docs)
- react-syntax-highlighter - https://github.com/react-syntax-highlighter/react-syntax-highlighter (official repo, npm package)
- jest-axe - Already in project's package.json and used in existing tests
- WCAG 2.1 Guidelines - https://www.w3.org/TR/WCAG21/ (W3C official specification)
- ARIA Authoring Practices - https://wai-aria-practices.netlify.app/aria-practices/ (W3C WAI official guide)

### Secondary (MEDIUM confidence)
- Copy to clipboard React patterns - https://www.creative-tim.com/learning-lab/nextjs/react-copy-to-clipboard/argon-dashboard
- Next.js component documentation best practices - https://nextjs.org/docs (official Next.js docs)
- React accessibility documentation - https://legacy.reactjs.org/docs/accessibility.html (official React docs)

### Tertiary (LOW confidence)
- Storybook alternatives discussion - https://github.com/erikpukinskis/codedocs/ (community project, not widely adopted)
- Design system documentation tools - https://www.supernova.io/blog/top-storybook-documentation-examples (blog post, good patterns but not authoritative)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Navigator Clipboard API and react-syntax-highlighter are industry standards with official documentation
- Architecture: HIGH - Patterns verified in existing `/debug/design-system` page, aligns with Next.js 15.5 app router
- Pitfalls: HIGH - Common issues documented in accessibility guidelines (WCAG, WAI-ARIA) and copy-to-clipboard tutorials

**Research date:** 2026-01-30
**Valid until:** 2026-03-30 (60 days - stable domain, APIs unlikely to change)

**Key constraints from CONTEXT.md:**
- Migration guide NOT needed (all code already uses new components)
- Categories match phase structure: Form Controls, Feedback, Layout, Smart Home
- Code snippets must have copy button (one-click copy to clipboard)
- Full JSX syntax highlighting (imports, components, props, strings colored)
- Both per-component a11y sections AND centralized accessibility reference page
- Document screen reader behavior (ARIA roles and what gets announced)
- User has discretion on: props-first vs examples-first ordering, grid vs sequential for variants, interactive playground controls, keyboard shortcut format, WCAG badge inclusion
