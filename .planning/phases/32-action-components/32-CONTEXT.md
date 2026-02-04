# Phase 32: Action Components - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Context Menu and Command Palette for quick actions and power-user navigation. Context Menu via right-click (desktop) or long-press (mobile). Command Palette via Cmd+K/Ctrl+K with fuzzy search. Device card integration is covered in Phase 36.

</domain>

<decisions>
## Implementation Decisions

### Context Menu behavior
- Long-press duration: Claude's discretion (follow platform conventions)
- Visual feedback during long-press: Scale animation (element shrinks slightly, like iOS)
- Item types supported: Actions, separators, and checkable items (toggle states)
- Keyboard shortcuts in menu items: No — keep menu clean, shortcuts learned via Command Palette

### Command Palette content
- Command types: Navigation + device actions + settings (full feature set)
- Organization: Grouped by type with section headers (Navigation, Device Actions, Settings)
- Keyboard shortcuts: Yes, show shortcuts aligned right of each command
- Recent commands: No — always start fresh, no history tracking

### Mobile experience
- Command Palette trigger: Nav bar icon (search/command icon in mobile navigation)
- Command Palette layout: Full screen on mobile (large touch targets)
- Auto-focus search input: Yes — keyboard opens immediately for typing
- Context Menu haptics: Yes, on open and when selecting an item

### Visual styling
- Menu item icons: Yes, all items have icons on the left
- Destructive actions: No special styling — rely on label clarity
- Backdrop: Blur + dim (consistent with Sheet/Modal)
- Command Palette placeholder: Shortcut reminder ("Press ⌘K to open")

### Claude's Discretion
- Long-press timing (follow platform conventions)
- Exact blur/dim values for backdrop
- Animation curves and durations
- Icon selection for menu items
- Fuzzy search algorithm/library choice

</decisions>

<specifics>
## Specific Ideas

- Scale animation during long-press should feel like iOS — subtle shrink that indicates "hold to activate"
- Command Palette full-screen on mobile matches the existing Sheet pattern (familiar to users)
- Haptic feedback pattern: light vibration on menu open, selection confirmation vibration on item tap

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 32-action-components*
*Context gathered: 2026-02-04*
