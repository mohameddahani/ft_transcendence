# Compact feedback cards

| File (relative to frontend/) | Final lines |
| --- | --- |
| `src/components/feedbacks/MemberFeedbackView.tsx` | 352, 687, 719, 750, 770, 776, 788 |
| `src/app/(portal)/feedbacks/page.tsx` | 356, 548, 602, 635, 677, 684, 703 |
| `docs/changes/2026-11-13-compact-feedback-cards/README.md` | 1 |

- Standard card radius, 16px padding, compact controls; 1/2/3 columns using the membership-plan breakpoints and available width.
- Three-line reviews/two-line responses; full text in existing popups. Smaller rating/response panels; short cards no longer stretch to fill rows.
- Passed: targeted ESLint, Tailwind/container-query compilation, unchanged-handler/data checks, whitespace check.
- Browser unavailable; TypeScript not rerun for presentation changes. Verify `/feedbacks` in both roles/themes, mobile/RTL and long content.
