# Feedback card typography

| File (relative to frontend/) | Final lines |
| --- | --- |
| `src/components/feedbacks/MemberFeedbackView.tsx` | 719, 732, 741, 770, 781, 797, 821 |
| `src/app/(portal)/feedbacks/page.tsx` | 602, 616, 677, 696, 716 |
| `docs/changes/2026-11-13-feedback-card-typography/README.md` | 1 |

- Both card views: 13px names/reviews, 12px responses/metadata/actions; compact icons and spacing.
- Passed: targeted ESLint, Tailwind compilation, class-only change verification, whitespace check.
- Browser unavailable; TypeScript not rerun for class-only edits. Verify cards in both themes and mobile/RTL.
