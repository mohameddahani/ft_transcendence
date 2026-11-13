# Opaque member-form dropdown menus

Date: 2026-11-13.

The Gender, Membership Plan, and Duration dropdown menus in Add New Member were too transparent. They all use `CustomSelect`, whose `.toota-card` glass background overrides its layered Tailwind `bg-popover` utility. The popup now explicitly uses `background: var(--popover)` in its existing inline style, which takes precedence over the glass background while preserving its layout.

The existing theme supplies opaque white (`#ffffff`) in light mode and charcoal (`#1f232a`) in dark mode. The change applies to the shared menu surface, including its existing uses in member editing/renewal and staff forms. Trigger styling, borders, shadows, rounding, selected/hover indicators, popup placement, scrolling, option values, callbacks, validation, and API payloads are unchanged.

## Files changed

Paths are relative to `frontend/`; line numbers refer to the final source.

| File | Final line | Change |
| --- | ---: | --- |
| `src/components/ui/CustomSelect.tsx` | 205 | Explicit opaque, theme-aware popup background. |
| `docs/changes/2026-11-13-member-dropdown-opacity/README.md` | 1 | Task record. |

No new text, translations, dependencies, or global tokens were added. Existing unrelated working-tree changes were preserved.

## Validation and limitations

- `./node_modules/.bin/eslint src/components/ui/CustomSelect.tsx`: passed, exit 0, no diagnostics or automatic fixes.
- `git diff --check`: passed. Source diff contains only the popup background declaration; reviewed all three Add New Member usages and the light/dark `--popover` values.
- Browser discovery reported that the browser access host was unavailable, so no live visual or interaction checks were performed. TypeScript was not rerun for this one-line style change.

## Manual verification

Open Add New Member and expand Gender, Membership Plan, and Duration in light and dark modes. Confirm underlying form content no longer shows through the options. Select values and verify they still populate the form. Check long/scrollable option lists, narrow screens, Arabic RTL, Escape/outside-click dismissal, and an existing shared select in Edit Member, Renew Membership, or a staff form.
