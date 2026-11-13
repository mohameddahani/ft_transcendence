# Member visit buttons

| File (relative to frontend/) | Final lines |
| --- | --- |
| `src/app/(portal)/visits/page.tsx` | 299, 303, 312, 320, 329, 410, 429, 523, 542, 549 |
| `docs/changes/2026-11-13-member-visit-buttons/README.md` | 1 |

- Clear selected tabs/counts in both themes; red Cancel Visit buttons, larger targets, wrapping actions. Cancellation behavior unchanged.
- Passed: targeted ESLint, Tailwind compilation, translation resolution and unchanged-handler checks, whitespace check.
- Browser unavailable; TypeScript not rerun for styling changes. Verify member `/visits` in both themes and narrow/RTL layouts.
