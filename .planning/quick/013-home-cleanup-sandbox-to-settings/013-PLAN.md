---
phase: quick-013
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/page.tsx
  - app/settings/page.tsx
autonomous: true

must_haves:
  truths:
    - "Home page shows only device cards with no title or description text above them"
    - "Settings page has a new Sandbox tab that contains the sandbox toggle and panel"
    - "When sandbox is toggled on in settings, going back to home shows the sandbox panel inline above cards"
    - "Sandbox toggle/panel no longer renders as part of the home page Section header area"
  artifacts:
    - path: "app/page.tsx"
      provides: "Clean home page with cards only, sandbox conditionally shown when enabled"
    - path: "app/settings/page.tsx"
      provides: "New Sandbox tab in settings with SandboxToggle component"
  key_links:
    - from: "app/settings/page.tsx"
      to: "app/components/sandbox/SandboxToggle.tsx"
      via: "import and render in Sandbox tab"
      pattern: "import SandboxToggle"
    - from: "app/page.tsx"
      to: "app/components/sandbox/SandboxPanel.tsx"
      via: "conditional render when sandbox enabled"
      pattern: "SandboxPanel"
---

<objective>
Clean up the home page by removing the "I tuoi dispositivi" title and description text, leaving only the device cards. Move the sandbox toggle functionality into a dedicated tab in the settings page. When sandbox is activated from settings, the SandboxPanel still appears on the home page above the cards grid.

Purpose: Declutter the home page for a cleaner dashboard experience, and relocate the sandbox development tool to settings where it belongs as a configuration option.
Output: Modified app/page.tsx (clean cards-only layout) and app/settings/page.tsx (new Sandbox tab)
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/page.tsx
@app/settings/page.tsx
@app/components/sandbox/SandboxToggle.tsx
@app/components/sandbox/SandboxPanel.tsx
@app/components/ui/Section.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Clean up home page - remove title/description, keep sandbox panel conditional</name>
  <files>app/page.tsx</files>
  <action>
Modify app/page.tsx to:

1. Remove the SandboxToggle import (line 7). Instead import SandboxPanel directly:
   `import SandboxPanel from './components/sandbox/SandboxPanel';`

2. Also import the sandbox check functions for server-side or pass through to client:
   Since SandboxPanel is a client component that already checks isLocalEnvironment and isSandboxEnabled internally, we just need to render it. It self-hides when not applicable.

3. Replace the current Section component usage. Remove the Section wrapper with title="I tuoi dispositivi" and description="Controlla e monitora..." entirely. Instead, render a simpler structure:
   - A `<section>` element with `className="py-8 sm:py-12 lg:py-16"` (matching Section spacing="lg")
   - Inside: render `<SandboxPanel />` (it self-hides when sandbox is not enabled or not localhost)
   - Then the Grid with cards
   - Then the EmptyState fallback

4. Remove the Section import from `'./components/ui'` if it's no longer used (check - it IS only used once). Update the import to: `import { Grid, EmptyState } from './components/ui';`

The result should be a home page that shows ONLY the device cards grid (with SandboxPanel above when enabled), no heading, no description text.
  </action>
  <verify>
Run `npm test -- --passWithNoTests --findRelatedTests app/page.tsx` to check no tests break.
Visually verify: the page.tsx file should have no "I tuoi dispositivi" string and no Section import.
  </verify>
  <done>Home page renders only device cards (and conditionally SandboxPanel when enabled). No title "I tuoi dispositivi" or description text visible.</done>
</task>

<task type="auto">
  <name>Task 2: Add Sandbox tab to settings page</name>
  <files>app/settings/page.tsx</files>
  <action>
Modify app/settings/page.tsx to add a new "Sandbox" tab:

1. Add import for SandboxToggle:
   `import SandboxToggle from '@/app/components/sandbox/SandboxToggle';`

2. Add import for FlaskConical icon from lucide-react (add to existing import):
   `import { Palette, MapPin, Smartphone, ChevronUp, ChevronDown, FlaskConical } from 'lucide-react';`

3. Create a new SandboxContent component (simple wrapper):
```tsx
function SandboxContent() {
  return (
    <div className="space-y-6 mt-6">
      <Text variant="secondary">
        Attiva la modalita sandbox per testare senza chiamate reali ai dispositivi
      </Text>
      <SandboxToggle />
    </div>
  );
}
```

4. In the SettingsPageContent component's Tabs section, add a new tab trigger and content AFTER the "dispositivi" tab:
   - Trigger: `<Tabs.Trigger value="sandbox" icon={<FlaskConical size={18} />}>Sandbox</Tabs.Trigger>`
   - Content: `<Tabs.Content value="sandbox"><SandboxContent /></Tabs.Content>`

Note: SandboxToggle already handles localhost detection internally (renders null if not localhost). So the tab will appear in settings but the content will be empty/hidden on production. This is acceptable since settings is a non-critical page.

If you want to be more explicit, you could conditionally render the tab trigger only on localhost, but SandboxToggle already handles this gracefully by rendering nothing.
  </action>
  <verify>
Run `npm test -- --passWithNoTests --findRelatedTests app/settings/page.tsx` to check no tests break.
Verify the file contains the new "sandbox" tab trigger and SandboxContent component.
  </verify>
  <done>Settings page has a 4th "Sandbox" tab. When clicked, it shows the SandboxToggle component (which includes the toggle switch and, when enabled, the full SandboxPanel). Tab only shows content on localhost environments.</done>
</task>

</tasks>

<verification>
1. Home page at `/` shows only device cards in a grid, no "I tuoi dispositivi" heading or description
2. Settings page at `/settings?tab=sandbox` shows the Sandbox toggle
3. When sandbox is activated in settings, navigating to home shows the SandboxPanel above the cards
4. Existing sandbox functionality (toggle on/off, panel controls) works unchanged
5. No TypeScript errors in modified files
</verification>

<success_criteria>
- Home page has zero heading/description text, only device cards grid
- Settings page has 4 tabs: Aspetto, Posizione, Dispositivi, Sandbox
- Sandbox activation from settings still makes SandboxPanel appear on home
- No broken imports or missing components
</success_criteria>

<output>
After completion, create `.planning/quick/013-home-cleanup-sandbox-to-settings/013-SUMMARY.md`
</output>
