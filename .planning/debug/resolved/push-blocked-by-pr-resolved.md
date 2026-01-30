---
status: investigating
trigger: "push-blocked-by-pr"
created: 2026-01-28T10:00:00Z
updated: 2026-01-28T11:30:00Z
---

## Current Focus

hypothesis: OAuth token used by macOS credential helper lacks 'workflow' scope needed to modify .github/workflows/ files
test: Examining remote configuration (HTTPS), credential storage (osxkeychain), and workflow file history
expecting: Token permissions insufficient - need to either re-authenticate with workflow scope OR switch to SSH
next_action: Provide user with three fix options: 1) Re-authenticate with workflow scope, 2) Switch to SSH, 3) Temporarily bypass

## Symptoms

expected: Push directly to main branch without PR requirement
actual: Push is rejected/blocked
errors: Branch protection error - mentions branch protection or PR requirement
reproduction: Trying to push through IDE/GUI (VSCode, GitHub Desktop, etc.)
started: Worked before, broke recently - used to be able to push directly

## Eliminated

- hypothesis: GUI tool (VSCode/GitKraken) has client-side branch protection
  evidence: Command line push gave SAME error about OAuth workflow scope - not GUI-specific
  timestamp: 2026-01-28T11:30:00Z

## Evidence

- timestamp: 2026-01-28T10:05:00Z
  checked: GitHub branch protection via API
  found: Branch NOT protected - API returns 404 "Branch not protected"
  implication: GitHub server-side is NOT blocking pushes

- timestamp: 2026-01-28T10:06:00Z
  checked: GitHub repository rulesets
  found: Empty array - no rulesets configured
  implication: No GitHub rulesets blocking pushes

- timestamp: 2026-01-28T10:07:00Z
  checked: Repository permissions
  found: User has "push":true permission, "admin":true
  implication: User has full push access to repository

- timestamp: 2026-01-28T10:08:00Z
  checked: Local git hooks
  found: Only .sample files present - no active hooks
  implication: No local pre-push hooks blocking

- timestamp: 2026-01-28T10:09:00Z
  checked: Git push --dry-run from command line
  found: Would succeed - "main -> main" (152 commits ahead)
  implication: Command line git push works fine - issue is GUI-specific

- timestamp: 2026-01-28T10:10:00Z
  checked: Git config for branch settings
  found: VSCode metadata (vscode-merge-base), GitKraken metadata (gk-*)
  implication: User is using GUI tools (VSCode/GitKraken) which may have their own restrictions

- timestamp: 2026-01-28T11:30:00Z
  checked: Command line push attempt by user
  found: Different error - "refusing to allow an OAuth App to create or update workflow `.github/workflows/e2e-tests.yml` without `workflow` scope"
  implication: Previous hypothesis WRONG - not a GUI tool issue, it's an OAuth token permission issue

- timestamp: 2026-01-28T11:31:00Z
  checked: Git remote configuration
  found: Using HTTPS (https://github.com/sirdoy/pannello_stufa.git), credential helper is osxkeychain
  implication: OAuth token stored in macOS keychain lacks workflow scope

- timestamp: 2026-01-28T11:32:00Z
  checked: Workflow file history
  found: e2e-tests.yml exists, last modified in commit 56228f9, part of commits being pushed
  implication: Push includes workflow file changes, which requires 'workflow' OAuth scope

## Resolution

root_cause: OAuth token stored in macOS keychain lacks 'workflow' scope. GitHub requires this scope when pushing commits that modify files in .github/workflows/. The token works for regular code pushes but is rejected when workflow files are included. Current push includes e2e-tests.yml (commit 56228f9).

fix: Three options provided to user - see fix options below
verification: Pending user choice
files_changed: []
