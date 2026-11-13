# Admin sidebar hide/show button

Date: 2026-11-13.

The admin requested a Lucide button to close the dashboard navigation and gain screen space. On desktop (`lg` and wider), the admin top bar now has a Hide sidebar / Show sidebar button using the installed `lucide-react` `PanelLeftClose` and `PanelLeftOpen` icons. Hiding the sidebar removes its 256px reserved margin and workspace corner rounding; showing it restores both. The button remains available beside the page title in either state.

The choice stays in the existing portal layout while navigating between portal pages and resets to expanded on a full reload. Mobile navigation retains its existing independent drawer state. Staff/member desktop navigation is unchanged. Existing page maximum widths are respected; this expands the application workspace without invoking browser fullscreen.

## Changed files

Paths are relative to `frontend/`; line numbers refer to the final source.

| File | Final lines | Change |
| --- | --- | --- |
| `src/app/(portal)/layout.tsx` | 14, 16, 22, 29, 31, 38, 39 | Layout state, admin-only collapse state, sidebar/top-bar props, conditional desktop margin and corners. |
| `src/components/layout/SideBar.tsx` | 33, 40, 473, 474 | Collapse prop and addressable desktop sidebar; omit `lg:flex` when collapsed. |
| `src/components/layout/TopBar.tsx` | 13, 14, 24, 25, 177, 180, 181, 182, 183, 184, 185, 188, 190 | Desktop admin toggle, Lucide icons, tooltip/accessibility label, expansion state, visible focus ring, RTL mirroring. |
| `src/lib/i18n.ts` | 121, 122, 1365, 1366, 2609, 2610 | New `hideSidebar` / `showSidebar` labels in English, French, and Arabic. Prior task's translation edits were preserved. |
| `docs/changes/2026-11-13-admin-sidebar-toggle/README.md` | 1 | Task record and verification steps. |

Previously, the desktop sidebar always had `lg:flex` and its content column always reserved `lg:ms-64`. They now follow the same layout-owned boolean, with the expanded appearance as the default. The new native button uses `aria-controls="desktop-sidebar"` and `aria-expanded`, and keeps keyboard focus when the sidebar is hidden. No dependencies, permissions, API calls, storage keys, or business logic were changed.

## Validation

- Targeted ESLint on the portal layout, `SideBar.tsx`, `TopBar.tsx`, and `i18n.ts`: passed, exit 0, no diagnostics or automatic fixes.
- `./node_modules/.bin/tsc --noEmit --incremental false`: the same four pre-existing errors reported during previous tasks: missing `next-themes` in `src/components/header/Header.tsx:5` and `src/components/theme/theme-provider.tsx:6`, and unsupported `icon-sm` button sizes in `src/components/ui/carousel.tsx:179` and `:209`. No errors in the affected files.
- Executed an in-memory harness against the actual transpiled components. React server rendering verified admin toggle labels, icons, `aria-expanded`, controlled sidebar visibility, mobile drawer markup, and absence of the desktop toggle for Staff/Member. A mocked React-state harness exercised the actual portal-layout callbacks to collapse/reopen, remove/restore spacing/corners, and preserve page content plus independent mobile state. This is not a browser interaction test.
- Real i18next resolution passed for both keys in all three languages without fallback. Compared resources against the pre-task working copy: only the two new keys were added in each language, with all existing values preserved.
- `git diff --check` passed; reviewed the scoped source diff. Existing unrelated working-tree edits remain intact.
- Browser discovery reported that the browser access host was unavailable. Live desktop/mobile, theme, RTL, and keyboard checks could not be performed. No backend requests, installs, or build were run.

## Manual verification

1. Sign in as an admin at a width of at least 1024px. On `/dashboard`, click the sidebar icon beside the page title: the sidebar should disappear, its reserved margin should be removed, and the icon/tooltip should change to Show sidebar.
2. Click again to restore navigation. Use Tab and Space/Enter to check focus visibility and activation. Inspect `aria-expanded` and its `desktop-sidebar` target.
3. Hide the sidebar, then navigate using an available in-page link. The portal layout should retain the collapsed state. A full reload should show the sidebar again.
4. Repeat in light/dark themes and English/French/Arabic. Arabic should retain logical workspace spacing and mirrored panel icons. Check both an ordinary desktop width and a wide screen, where page maximum widths still apply.
5. Resize below 1024px while collapsed: the existing hamburger should still open/close the mobile drawer. Resize back and reopen the desktop sidebar with the new toggle.
6. Sign in separately as staff/member and confirm their existing desktop navigation remains visible without the new admin toggle.
