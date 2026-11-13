# Admin feedback design

| File (relative to frontend/) | Final lines |
| --- | --- |
| `src/app/(portal)/feedbacks/page.tsx` | 602, 677, 684, 703, 716 |
| `src/components/feedbacks/ResolveFeedbackModal.tsx` | 114, 136, 170, 182, 223, 242 |
| `docs/changes/2026-11-13-admin-feedback-design/README.md` | 1 |

- Shared admin/staff cards: solid surfaces, 13px review / 12px resolution text. Compact popup: 13px review, clear status buttons, three-row note field, fixed action footer, RTL wrapping.
- Passed: targeted ESLint, four-status/validation/translation checks, Tailwind compilation, whitespace check. Save/API/role logic preserved.
- TypeScript: four existing errors (`next-themes`, carousel `icon-sm`). Browser unavailable.
- Verify `/feedbacks` in both themes, mobile/RTL, long reviews, all statuses and saved notes.
