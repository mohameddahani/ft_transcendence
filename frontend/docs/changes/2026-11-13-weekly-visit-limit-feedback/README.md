# Membership plan preset hover and selection feedback

Date: 2026-11-13.

The admin membership-plan dialog did not clearly distinguish hovered or selected weekly visit limits, especially in dark mode. The 1–7 buttons now show a lime border and subtle lime fill on hover, with a solid lime background and dark text for the selected value. Keyboard focus has a visible ring. The same control in the edit dialog uses matching feedback.

Follow-up: the duration dialog's Quick Presets had the same issue. Its 1 Month, 3 Months, 6 Months, and 1 Year buttons now use the same hover, selected, and keyboard-focus styles for both adding and editing durations.

## Changed files

Paths are relative to `frontend/`; line numbers refer to the final source.

| File | Final lines | Change |
| --- | --- | --- |
| `src/components/membership-plans/CreatePlanModal.tsx` | 203, 214, 216, 218, 219 | Translated group label, `aria-pressed`, focus ring, selected highlight, hover styling. |
| `src/components/membership-plans/EditPlanModal.tsx` | 214, 225, 227, 229, 230 | Matching feedback for the same selector when editing. |
| `src/components/membership-plans/DurationModal.tsx` | 218, 229, 233, 235, 236 | Translated Quick Presets group, pressed state, focus ring, selected highlight, and hover styling for add/edit duration. |
| `docs/changes/2026-11-13-weekly-visit-limit-feedback/README.md` | 1 | Task documentation. |

Both selectors reuse the existing `toota-lime`, `toota-side`, and `ring` color tokens. `aria-pressed` reflects the watched `weeklyVisitLimit` value, and the existing `weeklyVisitLimit` translation names the group in English, French, or Arabic. No new translation keys are needed. The existing `setValue` handler, validation, default of 7, status badge, and create/update API payloads remain unchanged.

The duration selector reuses those tokens and the existing `quickPresets` translation in all three languages. Its pressed state follows the watched `durationDays`, so editing the numeric field also updates the selected preset. Preset day values (30/90/180/365), labels, prices, validation, and `addMembershipPlanDuration`/`updateMembershipPlanDuration` calls were not changed.

## Validation

- `./node_modules/.bin/eslint src/components/membership-plans/CreatePlanModal.tsx src/components/membership-plans/EditPlanModal.tsx`: passed, exit 0, no diagnostics or automatic fixes.
- `./node_modules/.bin/tsc --noEmit --incremental false`: exit 2 with the same four pre-existing errors recorded during the previous task: missing `next-themes` in `src/components/header/Header.tsx:5` and `src/components/theme/theme-provider.tsx:6`; unsupported `icon-sm` sizes in `src/components/ui/carousel.tsx:179` and `:209`. No errors in the affected files.
- `git diff --check`: passed. Reviewed the two-file source diff; changes are limited to selector presentation and accessibility attributes.

Duration follow-up checks: `./node_modules/.bin/eslint src/components/membership-plans/DurationModal.tsx` passed with exit 0 and no diagnostics. `git diff --check` passed, and the duration source diff contains only group/button accessibility attributes and styling. Confirmed the existing `quickPresets` values are present in English, French, and Arabic. TypeScript was not rerun for this presentation-only follow-up; the earlier result above is retained as historical context. Browser discovery again reported that the browser host was unavailable.

## Manual verification

1. As an admin, open `/membership-plans` and choose Create Plan. Hover each number: the hovered choice should have a lime border and tinted background.
2. Click another number: only that choice should retain the solid lime highlight after moving the pointer away, and the existing visit-count badge should update.
3. Tab through the choices and activate one with Space or Enter. Check the focus ring and pressed state in the accessibility tree.
4. Repeat in Edit Plan, with light/dark themes, desktop/mobile widths, and Arabic RTL. On touch devices, confirm the persistent selected highlight without hover.
5. Open Add Duration and repeat hover/click/keyboard checks on Quick Presets. Select each preset and verify Duration (Days) shows 30/90/180/365. Enter a custom value such as 45: none of the presets should remain selected. Enter 90: 3 Months should highlight. Repeat in Edit Duration and across the themes, widths, and languages above.

Browser access was unavailable (the browser host reported it was unavailable), so these visual and interactive steps were not performed. No backend data was created or updated during validation. Existing unrelated changes were preserved.
