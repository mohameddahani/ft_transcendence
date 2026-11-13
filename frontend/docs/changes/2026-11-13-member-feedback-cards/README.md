# Member feedback cards

| File (relative to frontend/) | Final lines |
| --- | --- |
| `src/components/feedbacks/MemberFeedbackView.tsx` | 687, 719, 770, 776, 788 |
| `src/components/feedbacks/MemberFeedbackDetailModal.tsx` | 95, 140, 182, 186, 193, 214 |
| `src/lib/i18n.ts` | 751, 1995, 3239 |
| `docs/changes/2026-11-13-member-feedback-cards/README.md` | 1 |

- Solid cards, 13px review previews; compact Details popup with 13px full text. Preserves paragraphs, wraps long text, supports RTL.
- Passed: targeted ESLint, long-text/action/translation checks, Tailwind compilation, whitespace check. Existing click handlers preserved.
- TypeScript: four existing errors (`next-themes`, carousel `icon-sm`). Browser unavailable.
- Verify: member Feedback cards/Details, both themes, narrow screens, long reviews and management replies.
