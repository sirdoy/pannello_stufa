---
phase: 153
slug: pages-audit-extended-device-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 153 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright MCP (viewport 375×812) |
| **Config file** | none — uses Playwright MCP browser tools |
| **Quick run command** | `Playwright MCP screenshot + scrollWidth check per page` |
| **Full suite command** | `All 7 pages verified at 375px via Playwright MCP` |
| **Estimated runtime** | ~60 seconds per page |

---

## Sampling Rate

- **After every task commit:** Playwright screenshot + overflow check for modified pages
- **After every plan wave:** All pages in wave verified at 375px
- **Before `/gsd:verify-work`:** Full suite must show zero overflow
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 153-01-01 | 01 | 1 | AUDIT-06 | visual+overflow | `Playwright 375px /sonos scrollWidth <= innerWidth` | N/A MCP | ⬜ pending |
| 153-01-02 | 01 | 1 | AUDIT-07 | visual+overflow | `Playwright 375px /dirigera scrollWidth <= innerWidth` | N/A MCP | ⬜ pending |
| 153-01-03 | 01 | 1 | AUDIT-08 | visual+overflow | `Playwright 375px /raspi scrollWidth <= innerWidth` | N/A MCP | ⬜ pending |
| 153-01-04 | 01 | 1 | AUDIT-09 | visual+overflow | `Playwright 375px /tuya scrollWidth <= innerWidth` | N/A MCP | ⬜ pending |
| 153-02-01 | 02 | 1 | AUDIT-10 | visual+overflow | `Playwright 375px /rooms scrollWidth <= innerWidth` | N/A MCP | ⬜ pending |
| 153-02-02 | 02 | 1 | AUDIT-10 | visual+overflow | `Playwright 375px /rooms/status scrollWidth <= innerWidth` | N/A MCP | ⬜ pending |
| 153-02-03 | 02 | 1 | AUDIT-10 | visual+overflow | `Playwright 375px /rooms/[id] scrollWidth <= innerWidth` | N/A MCP | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Playwright MCP is already available. No new test files needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Playback controls usable on touch | AUDIT-06 | Interaction requires visual inspection | Navigate /sonos at 375px, verify play/pause/skip buttons are tappable |
| Room device assignments readable | AUDIT-10 | Text readability requires human judgment | Navigate /rooms/[id] at 375px, verify device list is readable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
