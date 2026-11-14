# Member tab colors

| File (relative to frontend/) | Final lines |
| --- | --- |
| `src/components/feedbacks/MemberFeedbackView.tsx` | 525, 526, 530, 541, 542, 546 |
| `src/app/(portal)/visits/page.tsx` | 306, 307, 312, 323, 324, 329 |
| `docs/changes/2026-11-13-member-tab-colors/README.md` | 1 |

- Four review/visit tabs now match the platform's main active tabs: dark in light mode, light in dark mode; matching count badges and neutral hover colors.
- Passed: targeted ESLint, Tailwind compilation, class-only verification, whitespace check.
- Browser unavailable; TypeScript not rerun for color-only changes. Verify both tabs on each member page in both themes.
