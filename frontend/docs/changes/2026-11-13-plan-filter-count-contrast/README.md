# Membership-plan filter count contrast

Date: 2026-11-13.

The All / Active / Inactive count badges were hard to read in dark mode. The selected badge used `dark:text-black` and `dark:bg-black/20` on a near-black selected button. Removed those overrides so the selected count retains white text on its translucent white badge. Unselected counts now use a subtle white-tinted badge and the existing high-contrast `toota-ink` token in dark mode. All badges have centered, tabular numbers with a consistent 20px height/minimum width and can grow for larger counts.

## Files changed

Paths are relative to `frontend/`; line numbers refer to the final source.

| File | Final lines | Change |
| --- | --- | --- |
| `src/app/(portal)/membership-plans/page.tsx` | 393, 395, 396 | Consistent count-badge sizing/alignment and selected/unselected dark-mode contrast. |
| `docs/changes/2026-11-13-plan-filter-count-contrast/README.md` | 1 | Task record. |

Only the count span's classes changed in this follow-up. The `statusFilter` selection, `tab.count` values, translations, click handlers, responsive card changes, and API calls remain intact. Light-mode badge colors are preserved.

## Validation and limitations

- Targeted ESLint on `src/app/(portal)/membership-plans/page.tsx`: passed, exit 0, no diagnostics or automatic fixes.
- `git diff --check`: passed; inspected the three changed class lines alongside the existing working-tree changes.
- Browser discovery reported that the browser access host was unavailable. No live dark/light screenshots or interactive checks were performed. TypeScript was not rerun for this class-only change.

## Manual verification

Open `/membership-plans` in dark mode and select All, Active, and Inactive in turn. Confirm selected counts remain white and unselected counts remain legible, including zero and multiple-digit counts. Switch to light mode and confirm the original badge colors remain, with consistent number alignment. Confirm selecting each filter still shows the matching plans.
