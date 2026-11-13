# Bug Log & Logic Corrections

| Bug ID | Route / Module | Impact / Description | Root Cause | Fix & Verification | Status |
|---|---|---|---|---|---|
| BUG-MP-01 | `membership-plans/page.tsx` | Hydration and layout shift during initial load | Missing structured skeleton preserving card dimensions | Added responsive skeleton cards matching grid geometry | RESOLVED |
| BUG-MP-02 | `membership-plans/page.tsx` | Status toggle required full page refresh or was slow to reflect | State did not optimistically update local array | Added optimistic state update on `handleToggleActive` | RESOLVED |
| BUG-MP-03 | `membership-plans/DurationModal.tsx` | Preset buttons did not recalculate or sync duration fields cleanly | Form was not triggering validation updates on preset click | Added `{ shouldValidate: true }` on preset clicks | RESOLVED |
| BUG-MP-04 | `lib/api/membership-plans.ts` | Backend responses wrapped in `{ data: [...] }` caused empty array return | Function assumed response is always a raw array | Added fallback to unwrapped `data.data` if wrapped | RESOLVED |
| BUG-MP-05 | `membership-plans/CreatePlanModal.tsx` | Multiple clicks on submit created duplicate plans | Button remained clickable while submitting | Added `disabled={isSubmitting}` and `<Loader2 />` spinner | RESOLVED |

