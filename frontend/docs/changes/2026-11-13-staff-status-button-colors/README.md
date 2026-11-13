# Staff status button colors

| File (relative to frontend/) | Final lines |
| --- | --- |
| `src/app/(portal)/staffs/[id]/page.tsx` | 330, 343, 356 |
| `docs/changes/2026-11-13-staff-status-button-colors/README.md` | 1 |

- Staff details: green Activate, amber Pending, red Ban; hover/focus colors for both themes. Existing dimensions and behavior preserved.
- Passed: targeted ESLint, Tailwind compilation/class merging, class-only verification, whitespace check.
- Browser unavailable; TypeScript not rerun for class-only edits. Verify all staff statuses, both themes, keyboard focus and pending actions.
