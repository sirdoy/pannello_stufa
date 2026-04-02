---
phase: 154
slug: pages-audit-admin-support-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 154 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright MCP (browser-based visual verification) |
| **Config file** | none — uses Playwright MCP tools directly |
| **Quick run command** | `Playwright screenshot at 375x812 + scrollWidth check` |
| **Full suite command** | `npm test` (existing Jest suite for regression) |
| **Estimated runtime** | ~30 seconds per page screenshot |

---

## Sampling Rate

- **After every task commit:** Playwright screenshot + overflow check for modified pages
- **After every plan wave:** `npm test` for regression
- **Before `/gsd:verify-work`:** Full suite must be green + all pages visually verified
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 154-01-01 | 01 | 1 | AUDIT-11 | visual | Playwright 375x812 screenshot /registry/devices + /registry/types | N/A | ⬜ pending |
| 154-01-02 | 01 | 1 | AUDIT-12 | visual | Playwright 375x812 screenshot all settings sub-pages | N/A | ⬜ pending |
| 154-02-01 | 02 | 1 | AUDIT-13 | visual | Playwright 375x812 screenshot /debug, /debug/api, /debug/logs, /debug/notifications | N/A | ⬜ pending |
| 154-02-02 | 02 | 1 | AUDIT-14 | N/A | Camera pages don't exist — mark as N/A | N/A | ⬜ pending |
| 154-02-03 | 02 | 1 | AUDIT-15 | visual | Playwright 375x812 screenshot /changelog, /offline, /log | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Playwright MCP is already available. Jest test suite exists for regression checks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Horizontal overflow check | AUDIT-11 to AUDIT-15 | Visual inspection at 375px viewport | Navigate to each page at 375x812, verify document.body.scrollWidth <= window.innerWidth |
| Clipped controls | AUDIT-12 | Form controls may be partially hidden | Check all settings form inputs, toggles, and buttons are fully visible and tappable |
| Data table readability | AUDIT-11 | Column content may truncate excessively | Verify registry table columns show meaningful data when scrolled horizontally |

---

## Validation Sign-Off

- [ ] All tasks have visual Playwright verification
- [ ] Sampling continuity: every page screenshot-verified after fixes
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
