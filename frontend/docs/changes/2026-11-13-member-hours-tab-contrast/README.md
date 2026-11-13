# Member Opening Hours contrast

| File (relative to frontend/) | Final lines |
| --- | --- |
| `src/components/operating-hours/MemberOperatingHoursView.tsx` | 488, 497 |
| `docs/changes/2026-11-13-member-hours-tab-contrast/README.md` | 1 |

- Selected weekly tab/count use theme-aware contrast, matching the admin fix. Behavior unchanged.
- Targeted ESLint and `git diff --check`: passed.
- Browser unavailable; TypeScript not rerun for two class-only changes.
- Verify: member `/operating-hours`, select weekly/special tabs in dark and light modes.
