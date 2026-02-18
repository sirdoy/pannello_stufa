# Phase 70: Measurement Baseline + Quick Wins - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish bundle/Lighthouse baselines and Web Vitals pipeline; apply zero-risk font self-hosting and resource hint optimizations. This phase creates the measurement foundation all future v9.0 phases (71-74) compare against.

</domain>

<decisions>
## Implementation Decisions

### Font loading behavior
- Keep current font families OR propose alternatives that better fit Ember Noir theme — Claude has discretion to change typefaces if a better fit exists
- Font-display strategy: Claude's discretion (swap vs optional)
- Subsetting: Claude's discretion based on actual character usage in the app
- Font weights: Claude audits current usage and includes only the weights actually used

### Web Vitals pipeline
- Report to BOTH browser console (for dev debugging) AND existing Phase 54 analytics pipeline (for production tracking)
- Always collected — NOT consent-gated. Web Vitals are technical performance data, not user behavior analytics
- Add a new Web Vitals section to the analytics dashboard showing metric health
- Dashboard detail level: Claude's discretion (summary cards, trend charts, etc.)

### Baseline storage
- Location: Claude's discretion
- Format: Claude's discretion (optimize for before/after comparison across phases 71-74)
- Lighthouse inclusion: Claude's discretion
- Must include a reusable script that can be re-run after each optimization phase to generate a comparison report against the original baseline

### Claude's Discretion
- Font-display strategy and subsetting approach
- Typeface selection (may propose alternatives to current Google Fonts)
- Font weight minimization based on usage audit
- Baseline storage location and format
- Lighthouse vs bundle-only baseline scope
- Web Vitals dashboard detail level

</decisions>

<specifics>
## Specific Ideas

- Reusable baseline script is important — user wants to re-run after phases 71, 72, 73, 74 to track improvement
- Web Vitals are technical data and should bypass GDPR consent (unlike user behavior analytics)
- Analytics dashboard already exists from Phase 54 — new vitals section should integrate naturally with existing design

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 70-measurement-baseline-quick-wins*
*Context gathered: 2026-02-18*
