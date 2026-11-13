# Responsive membership-plan cards

Date: 2026-11-13.

The admin reported crowded or nonresponsive plan-card data at viewport widths of 1500px and below. The old grid switched to three columns at a 1280px viewport, even when the fixed sidebar consumed 256px of that space. Duration rows also kept their status, prices, and action controls on one line.

The plan grid and loading skeleton now follow the available page width through a named `plans` container: one column below 48rem, two columns from 48rem, and three from 78rem. With the normal 16px root size, these content-width thresholds are 768px and 1248px. This also responds to the admin sidebar being hidden or shown, rather than relying only on the viewport width.

Plan headers, duration-section headings, duration rows, price/action groups, and footers can wrap when needed. Plan names can wrap instead of truncating; long unbroken text/numbers can break within their available width. The existing two-line description preview remains. Card styling, spacing tokens, content, translations, filtering, mutation handlers, modal props, and API contracts are unchanged.

## Changed files

Paths are relative to `frontend/`; line numbers refer to the final source.

| File | Final lines | Change |
| --- | --- | --- |
| `src/app/(portal)/membership-plans/page.tsx` | 263, 421, 477 | Named available-width container and matching responsive skeleton/card grids. |
| `src/app/(portal)/membership-plans/page.tsx` | 485, 489, 490, 495, 499 | Shrinkable cards and wrapping plan header/name/description. |
| `src/app/(portal)/membership-plans/page.tsx` | 559, 569 | Duration heading and Add Duration action can occupy separate lines. |
| `src/app/(portal)/membership-plans/page.tsx` | 602, 604, 609, 645, 646, 647, 651 | Wrapping duration/status and price/action groups, long-number handling, logical end alignment for RTL. |
| `src/app/(portal)/membership-plans/page.tsx` | 693, 698 | Footer ID and edit/delete group wrap rather than competing for one line. |
| `docs/changes/2026-11-13-membership-plan-card-responsive/README.md` | 1 | Task record and manual verification steps. |

Before: `md:grid-cols-2 xl:grid-cols-3`, with duration actions forced into a nonshrinking row. After: `@min-[48rem]/plans:grid-cols-2 @min-[78rem]/plans:grid-cols-3`, with bounded wrapping groups. All application changes are `className` values in `MembershipPlansPage`; shared components and other pages were not edited.

## Validation

- `./node_modules/.bin/eslint 'src/app/(portal)/membership-plans/page.tsx'`: passed, exit 0, no diagnostics or automatic fixes.
- `./node_modules/.bin/tsc --noEmit --incremental false`: the same four pre-existing errors recorded in previous tasks: missing `next-themes` in `src/components/header/Header.tsx:5` and `src/components/theme/theme-provider.tsx:6`, and unsupported `icon-sm` button sizes in `src/components/ui/carousel.tsx:179` and `:209`. No errors in the affected page.
- Compiled the page's class candidates against the real global stylesheet using the installed Tailwind compiler, entirely in memory. Verified emission of the named container, 48rem/two-column and 78rem/three-column rules, and `overflow-wrap: anywhere`. No build output was written.
- Compared pre-change and final TypeScript syntax trees with only `className` values normalized: identical. This confirms data rendering, labels, event handlers, filters, API calls, and modal configuration were preserved.
- `git diff --check` passed. Reviewed the scoped diff; unrelated existing changes were preserved.
- Browser discovery reported the browser access host was unavailable. No live resize, screenshot, theme, RTL, or interactive checks were performed. CSS compilation and source checks do not establish pixel-perfect rendering. No backend requests or dependency installations were run.

## Manual verification

1. Sign in as an admin and open `/membership-plans` with multiple plans and durations. Resize through 1500, 1440, 1366, 1280, 1024, 768, 390, and 320px. Repeat with the desktop sidebar hidden/shown where available.
2. Check that cards use fewer columns when the content area narrows and duration/status, MAD/G prices, and edit/delete controls wrap without overlapping or extending outside the card. Also check loading skeletons during refresh.
3. Use plans with 30-character names, an unbroken name/description, several durations, active/inactive states, large prices, and optional G prices. Confirm no card data or action disappears. Empty-duration cards should retain their Add first duration action.
4. Repeat in light/dark themes and English/French/Arabic; verify Arabic alignment follows the logical inline direction. Check keyboard access to all wrapped actions.
5. Confirm search/status filtering and opening the plan/duration add/edit/delete dialogs still work. At wider content widths, confirm the grid can return to three columns.
