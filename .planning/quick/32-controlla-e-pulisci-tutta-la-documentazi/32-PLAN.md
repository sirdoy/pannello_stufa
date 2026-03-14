---
phase: quick-32
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - docs/archive/ (entire directory deleted)
  - docs/security/SECURITY-RULES-FIXES.md (deleted)
  - docs/security/SECURITY-VERIFICATION-REPORT.md (deleted)
  - docs/security/README.md (deleted)
  - docs/visual-screenshots.md (deleted)
  - docs/page-transitions.md (deleted)
  - docs/accessibility.md (deleted)
  - docs/components/navigation.md (deleted)
  - API.md (deleted)
  - FIRESTORE_INDEX_DEPLOYMENT.md (deleted)
  - docs/INDEX.md (updated)
  - CLAUDE.md (NOT touched)
  - README.md (NOT touched)
autonomous: true
requirements: [QUICK-32]
must_haves:
  truths:
    - "All archive/ documentation is removed (16K lines of historical noise)"
    - "Stale one-off reports and guides are removed"
    - "INDEX.md accurately reflects remaining docs"
    - "No active, useful documentation is deleted"
  artifacts:
    - path: "docs/INDEX.md"
      provides: "Updated index reflecting cleaned state"
  key_links: []
---

<objective>
Review and clean all unnecessary documentation from the project. Remove stale archive files, outdated one-off reports, and documentation that no longer reflects the codebase (migrated from JS to TS in v5.0, 13 milestones ago).

Purpose: Reduce documentation noise, keep only actively useful docs.
Output: Leaner docs/ directory with accurate INDEX.md.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@docs/INDEX.md
@CLAUDE.md

## Analysis of what to delete vs keep

### DELETE - Archive (16,081 lines total, purely historical)
The entire `docs/archive/` directory contains old implementation plans, research packs, reports, and completed migration notes from 2025. All of this predates the TypeScript migration (v5.0) and is no longer relevant. The archive includes:
- `archive/plans/` - 6 old implementation plans (Auth, Backend Refactoring, Firebase, Homepage, Hue)
- `archive/research/` - 6 old research packs
- `archive/reports/` - 5 old reports (design consolidation, migration summary, etc.)
- `archive/completed/` - 4 completed task docs (component consolidation, iOS liquid glass, multi-schedule, netatmo fixes)
- `archive/E2E-TESTING.md` - old E2E testing doc (replaced by docs/testing.md)
- `archive/firebase-security.md` - old security doc (replaced by docs/firebase.md)
- `archive/README.md` - archive index

### DELETE - Stale root-level files
- `API.md` (1000 lines) - HomeAssistant Network API doc, only referenced in archive READMEs, not in active code
- `FIRESTORE_INDEX_DEPLOYMENT.md` (83 lines) - one-off deployment guide, only referenced in .planning/debug/

### DELETE - Stale docs/ files
- `docs/security/` (entire directory, 612 lines) - dated 2025-11-28 security rules fixes and verification report, one-off work
- `docs/visual-screenshots.md` (153 lines) - references `middleware.js` (now .ts), Auth0 bypass for Playwright screenshots, one-off guide
- `docs/page-transitions.md` (535 lines) - references .js files (7 occurrences), cinematographic page transitions doc
- `docs/accessibility.md` (542 lines) - "Ember Noir v3.0" accessibility guide, not referenced in INDEX.md, likely aspirational
- `docs/components/navigation.md` - standalone component doc in subdirectory

### KEEP - Active documentation
- All `docs/setup/` (netatmo, hue, fritzbox) - active integration guides
- `docs/systems/` (errors, maintenance, monitoring, notifications) - active system docs
- `docs/architecture.md`, `docs/api-routes.md`, `docs/design-system.md` - core refs from CLAUDE.md
- `docs/firebase.md`, `docs/testing.md`, `docs/troubleshooting.md` - core refs from CLAUDE.md
- `docs/patterns.md`, `docs/pwa.md`, `docs/deployment.md` - active development docs
- `docs/sandbox.md`, `docs/quick-start.md` - useful despite .js refs (minor, content still valid)
- `docs/data-flow.md`, `docs/stove-status-mapping.md` - reference docs
- `docs/ui-components.md`, `docs/ui-modal.md`, `docs/versioning.md` - active UI/workflow docs
- `CHANGELOG.md`, `README.md`, `CLAUDE.md` - never touch
</context>

<tasks>

<task type="auto">
  <name>Task 1: Delete stale documentation files</name>
  <files>
    docs/archive/ (entire directory)
    docs/security/ (entire directory)
    docs/visual-screenshots.md
    docs/page-transitions.md
    docs/accessibility.md
    docs/components/navigation.md
    docs/components/ (directory if empty after)
    API.md
    FIRESTORE_INDEX_DEPLOYMENT.md
  </files>
  <action>
Delete all files and directories listed below using `rm -rf` or `rm`:

1. `rm -rf docs/archive/` - Remove entire archive directory (16,081 lines of historical plans, research packs, reports)
2. `rm -rf docs/security/` - Remove security directory (one-off 2025-11-28 reports, 612 lines)
3. `rm docs/visual-screenshots.md` - Stale Playwright screenshot guide referencing middleware.js
4. `rm docs/page-transitions.md` - Outdated page transitions doc with .js references
5. `rm docs/accessibility.md` - Unreferenced accessibility guide (not in INDEX.md sections used by CLAUDE.md)
6. `rm docs/components/navigation.md` and `rmdir docs/components/` - Isolated component doc
7. `rm API.md` - Root-level HomeAssistant API doc (1000 lines), not referenced by active code
8. `rm FIRESTORE_INDEX_DEPLOYMENT.md` - One-off deployment guide (83 lines)

DO NOT delete:
- Any file referenced in CLAUDE.md (architecture, api-routes, design-system, firebase, testing, troubleshooting)
- CHANGELOG.md, README.md, CLAUDE.md
- docs/setup/*, docs/systems/*
- Any file in docs/ not listed above
- Any .planning/ files
  </action>
  <verify>
    <automated>test ! -d docs/archive && test ! -d docs/security && test ! -f docs/visual-screenshots.md && test ! -f docs/page-transitions.md && test ! -f docs/accessibility.md && test ! -f docs/components/navigation.md && test ! -f API.md && test ! -f FIRESTORE_INDEX_DEPLOYMENT.md && echo "ALL DELETED OK"</automated>
  </verify>
  <done>All stale documentation files and directories are removed. Approximately 19,000+ lines of unnecessary documentation deleted.</done>
</task>

<task type="auto">
  <name>Task 2: Update INDEX.md to reflect cleaned state</name>
  <files>docs/INDEX.md</files>
  <action>
Update docs/INDEX.md to remove references to deleted files and clean up sections:

1. Remove from "UI and Design" section:
   - `page-transitions.md` row
   - `components/navigation.md` row

2. Remove entire "Security" section (the `security/` link)

3. Remove from "Reference" section:
   - `visual-screenshots.md` row

4. Remove entire "Archive" section (the `archive/` link and description)

5. Remove the "Optimization Summary (v1.76.0)" table at the bottom (historical, no longer relevant)

6. Update the footer stats line to reflect actual file count. Count remaining docs:
   - Core: quick-start, architecture, troubleshooting (3)
   - Development: api-routes, patterns, data-flow, firebase (4)
   - UI and Design: design-system, ui-components, ui-modal (3)
   - Systems: maintenance, monitoring, errors, notifications (4)
   - External Integrations: netatmo-setup, hue-setup, fritzbox-setup (3)
   - PWA and Testing: pwa, testing, sandbox, versioning, deployment (5)
   - Reference: stove-status-mapping (1)
   - Total: 23 active docs

   Update to: `**Docs attivi**: 23 file | **Last Updated**: 2026-03-14`

7. Keep the "Principi" block at the bottom (still valid guidelines).
  </action>
  <verify>
    <automated>grep -c "page-transitions\|visual-screenshots\|archive\|navigation\.md\|security/" docs/INDEX.md | xargs test 0 -eq && echo "INDEX CLEAN OK"</automated>
  </verify>
  <done>INDEX.md accurately lists only the remaining 23 documentation files with no broken references.</done>
</task>

</tasks>

<verification>
- `find docs -name "*.md" | wc -l` returns approximately 23 files (down from 55+)
- `docs/INDEX.md` contains no references to deleted files
- All files referenced in CLAUDE.md still exist: architecture.md, api-routes.md, design-system.md, firebase.md, testing.md, troubleshooting.md, INDEX.md
- No broken links in INDEX.md (all referenced files exist)
</verification>

<success_criteria>
- Archive directory (16K+ lines) completely removed
- Stale one-off docs removed (security reports, API.md, screenshots guide, etc.)
- INDEX.md updated with accurate file list and no dead links
- All documentation referenced by CLAUDE.md remains intact
- Total documentation reduced from 55+ files to ~23 active files
</success_criteria>

<output>
After completion, create `.planning/quick/32-controlla-e-pulisci-tutta-la-documentazi/32-SUMMARY.md`
</output>
