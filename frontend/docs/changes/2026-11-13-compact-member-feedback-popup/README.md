# Compact member feedback popup

| File (relative to frontend/) | Final lines |
| --- | --- |
| `src/components/feedbacks/MemberFeedbackDetailModal.tsx` | 95, 100, 140, 186, 193, 213 |
| `docs/changes/2026-11-13-compact-member-feedback-popup/README.md` | 1 |

- 512px maximum width, 80vh height cap, compact padding/controls and 13px review/response text. Full content scrolls above the footer.
- Passed: targeted ESLint, Tailwind compilation, class-only change verification, whitespace check.
- Browser unavailable; TypeScript not rerun for class-only edits. Verify both themes, mobile/RTL and long reviews/responses.
