# Compact feedback popup

| File (relative to frontend/) | Final lines |
| --- | --- |
| `src/components/feedbacks/ResolveFeedbackModal.tsx` | 114, 117, 137, 170, 184, 198, 225, 242 |
| `docs/changes/2026-11-13-compact-feedback-popup/README.md` | 1 |

- 512px maximum width, 80vh height cap, tighter spacing, smaller controls, 13px review text and three-row note field. Full review scrolls; keyboard focus supported.
- Passed: targeted ESLint, Tailwind compilation, unchanged-handler/save-logic checks, whitespace check.
- Browser unavailable; TypeScript not rerun for presentation changes. Verify both themes, narrow/RTL layouts, long reviews and saving.
