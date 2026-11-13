# Opening Hours contrast, presets, and responsive cards

Date: 2026-11-13.

The admin requested fixes for the Weekly Operating Hours tab and Configure Day button in dark mode, clearer weekday selection in Add Regular Day, a better preset design in both regular-day and special-closure dialogs, and responsive Special Hours & Closures cards.

## Result

- The selected weekly tab and count now use contrasting foreground/background tokens in both themes. Both section buttons wrap on small screens and expose their pressed state and keyboard focus.
- Configure Day has explicit readable text, a lime hover background/border, and a focus ring. Its callback still opens the requested day.
- Regular-day choices have a solid lime selected state, distinct hover/focus, full translated day names in accessible labels/tooltips, and `aria-pressed`. Configured days remain unavailable when adding; all weekday changes remain disabled while editing.
- Both dialogs use opaque theme-aware card surfaces. Presets are now responsive cards with a translated label on one line and time/date details below it. Their selected state follows the actual form values, including manual edits. The four existing time intervals and four existing date-range choices are retained.
- Dialog footers stack on narrow screens, long labels can wrap, time-input padding follows RTL, and closure switches have accessible names and focus feedback.
- Page grids follow an `hours` content-width container, including sidebar expansion/collapse. Closure badges and multi-day date ranges wrap within shrinkable cards; weekly cards and metrics also use available-width breakpoints. Existing themes, fonts, semantic colors, and the 1440px page maximum remain.

## Files changed

Paths are relative to `frontend/`; line numbers refer to the final source.

| File | Final lines | Change |
| --- | --- | --- |
| `src/components/operating-hours/AdminStaffOperatingHoursView.tsx` | 328, 331, 407 | Content-width container and responsive header/KPI grids. |
| `src/components/operating-hours/AdminStaffOperatingHoursView.tsx` | 577, 580, 589, 600 | Tab contrast, pressed states, and focus feedback. |
| `src/components/operating-hours/AdminStaffOperatingHoursView.tsx` | 640, 682 | Available-width weekly grid and Configure Day styling. |
| `src/components/operating-hours/AdminStaffOperatingHoursView.tsx` | 876, 937, 942 | Responsive closure grid, wrapping dates/badges, and mirrored date arrow. |
| `src/components/operating-hours/WorkingHourModal.tsx` | 39, 191, 234, 246 | Original time presets with translated names, solid dialog, weekday group/pressed states. |
| `src/components/operating-hours/WorkingHourModal.tsx` | 305, 318, 325, 330, 406 | Switch focus, responsive preset cards, selected styling, and responsive footer. |
| `src/components/operating-hours/SpecialHourModal.tsx` | 37, 109, 121, 176 | Date-preset data, shared range calculation for preview/selection, solid dialog. |
| `src/components/operating-hours/SpecialHourModal.tsx` | 218, 226, 228, 321, 391 | Responsive translated date presets, pressed states, switch focus, responsive footer. |
| `src/lib/i18n.ts` | 1176, 1177, 1178, 1179, 1180, 1181, 1182 | English preset labels. |
| `src/lib/i18n.ts` | 2420, 2421, 2422, 2423, 2424, 2425, 2426 | French preset labels. |
| `src/lib/i18n.ts` | 3664, 3665, 3666, 3667, 3668, 3669, 3670 | Arabic preset labels. |
| `docs/changes/2026-11-13-opening-hours-design/README.md` | 1 | Task record. |

New keys: `hoursPresetStandard`, `hoursPresetExtended`, `hoursPresetMorning`, `hoursPresetWeekend`, `tomorrow`, `closurePresetWeek`, `closurePresetHoliday`. Existing `quickPresets`, `today`, and weekday translations are reused. Prior working-tree translation edits were preserved.

The weekly tab previously used `bg-toota-ink text-white`, producing pale text on a pale background in dark mode. It now uses `bg-toota-ink text-toota-main`. Preset cards replace the old `toota-pill` sizing overrides with ordinary token-based classes and separate labels/details. Date calculation was extracted from `setDatePreset` into `getDatePreset` so previews and selection checks use the same original calculation; date-offset and serialization semantics were not changed.

## Validation

- Targeted ESLint on the three affected components and `src/lib/i18n.ts`: passed with exit 0 and no diagnostics or automatic fixes.
- `./node_modules/.bin/tsc --noEmit --incremental false`: the same four pre-existing errors recorded in earlier tasks: missing `next-themes` in `src/components/header/Header.tsx:5` and `src/components/theme/theme-provider.tsx:6`, and unsupported `icon-sm` sizes in `src/components/ui/carousel.tsx:179` and `:209`. No errors in the affected files.
- Executed in-memory component harnesses with mocked React/form/API dependencies: checked weekday selection, configured-day disabling, editing-day locking, all four time presets and selected states, custom-time/date deselection, hidden presets on closed days, regular-day submission, and full-/partial-closure payloads. Compared all four date presets to the pre-change component under the same fixed clock; resulting form values match.
- Exercised the actual page callbacks in a mocked-state harness: weekly/special tab switching, Configure Day forwarding the chosen day, closure fixtures, and opening the correct closure for editing.
- Syntax-tree comparison confirms page calculations/filtering/mutations and both dialog submission functions are unchanged. API helpers, validation schemas, permissions, and payload contracts were not edited.
- Real i18next checks confirmed the seven new keys plus reused preset labels resolve in English, French, and Arabic without fallback; all pre-existing resource values match the pre-task working copy. French/Arabic component renders contained no exposed new keys.
- The installed Tailwind compiler successfully generated styles for the three components entirely in memory, including named `hours` container breakpoints and compact/wide preset grids. No build files were written.
- `git diff --check` passed. Existing unrelated changes were preserved; no dependencies were installed and no real backend records were changed.

Browser discovery reported that the browser access host was unavailable. No live visual, resize, theme, or keyboard checks were performed. Mocked component checks and CSS compilation do not establish pixel-perfect rendering. Existing date/timezone behavior and service validation remain as implemented before this task.

## Manual verification

1. In dark mode, open `/operating-hours`. Check that Weekly Operating Hours and its count remain readable when selected. Switch between both tabs and check hover/focus and counts. Hover/focus Configure Day on an unset day and open it.
2. In Add Regular Day, hover and select different available weekdays. Only the selected day should stay lime. Configured weekdays must stay disabled. Edit an existing day and confirm the weekday remains locked.
3. Try each time preset, then manually change a time: the preset highlight should follow the current interval. Confirm the unchanged intervals: 06:00–22:00, 06:00–23:30, 07:00–15:00, and 08:00–20:00. Mark the facility closed and confirm time presets are hidden.
4. In Add/Edit Special Closure, try Today, Tomorrow, In 1 Week, and 3-Day Holiday. Check that the displayed dates agree with the date fields and that custom dates clear preset selection. Check full-day and partial closure controls and existing validation messages.
5. Resize the page through 1500, 1366, 1280, 1024, 768, 390, and 320px, with the sidebar expanded/collapsed where available. Closure grids should reduce columns based on the workspace, and full-day/partial, current/past/upcoming badges and single-/multi-day dates must fit without overlap. Check empty/filter states and edit/delete controls.
6. Repeat in light mode and French/Arabic. Check full day names via tooltips/accessibility labels, RTL alignment, dialog scrolling at short heights, long action labels, and keyboard activation/focus. Save representative regular/full-day/partial records in a team test environment to verify the end-to-end service flow.
