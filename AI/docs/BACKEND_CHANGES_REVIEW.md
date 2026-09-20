# Backend changes review — `0fbb196` → `5c2dc0c`

*Reviewed 2026-09-20. 21 migrations, 89 files, ~3,950 lines added. Two halves: what it breaks on
the AI side (our work), and what to send Dahani (his work).*

He delivered `Feedback`, attendance, nullable `paidAt` — and a lot more that was not on the ask
list: a **STAFF role**, a **booking system with QR check-in**, and **opening hours as data**.

**The headline: the AI service will not boot against this schema.** There is no `check_ins` table;
attendance is called `attendances` and has a different shape. That is the startup schema check
doing exactly its job — it refuses to run rather than failing inside a tool call during a demo.

---

# Part 1 — What changed, and what it costs us

## 1.1 `check_ins` → `attendances` (breaking)

Our shadow table was a guess at his shape. His is richer:

| Ours (`check_ins`) | His (`attendances`) |
|---|---|
| `id`, `admin_id`, `member_id`, `checked_in_at` | `id`, `admin_id`, `member_id`, **`membership_id`**, **`staff_id?`**, **`visit_id` (unique)**, **`attendance_method`**, `checked_in_at`, `created_at`, `updated_at` |

Indexes are better than we asked for: `(admin_id, checked_in_at)`, `(member_id, checked_in_at)`,
`(admin_id, member_id, checked_in_at)`, `(membership_id, checked_in_at)`.

**Work this creates:** roll back `seeder/pending/001_check_ins_feedbacks.sql`, run his migrations,
then rename the table and add the new columns across `schema.py`, `models.py`, `reports.py`,
`tools/admin.py`, `tools/members.py`, the read-only grants, `seeder/attendance.py` and
`verify.sh`. Not hard, but it touches every layer, which is the point of having done it once
already.

**One consequence to think about before rewriting the seeder:** an attendance now *requires* a
visit (`visit_id` is NOT NULL and unique). Check-in refuses if the member has no visit booked for
today. So our generated attendance data has to generate a `visits` row for every check-in, and the
archetypes change meaning: the "fader" is now visible twice, in bookings and in attendance.

**And a gain:** `membership_id` on attendance means attendance can finally be attributed to a plan
— "do VIP members come more often than Basic ones?" becomes answerable.

## 1.2 `feedbacks` — close to what we modelled, with additions

His columns beyond ours: `staff_id?`, `feedback_status` (`OPEN`/`IN_REVIEW`/`RESOLVED`/`DISMISSED`),
`resolved_at`, `resolved_by`, `resolution_note`, plus a `feedback_likes` table.

Three differences that touch our code:

- **`rating` is NOT NULL.** We modelled it optional. Harmless for parsing, but our seeder's
  "unscored backlog" rows must still carry a rating.
- **The enum is `SentimentType`, not `Sentiment`**, with the same three values. Our shadow SQL
  created the other name. The boot check only sees `USER-DEFINED`, so it passes — the seeder is
  what breaks.
- **`sentiment_score` is `Decimal(3,2)`**, ours was `(4,3)`. A confidence of `0.87` fits; three
  decimal places no longer do. Our sentiment module must round to two.

`feedback_status` is a genuine addition for us: "show me the open complaints" is a better demo
question than "show me recent feedback", and it gives the sentiment panel something to act on.

## 1.3 `payments.paid_at` and `due_date` are now nullable (breaking, quietly)

Ask #9 granted. But our read model declares both as required `datetime`, so **the first NULL row
raises a validation error inside a tool call** — and the boot check will not catch it, because it
verifies column *types*, not nullability.

Fix: make both `datetime | None` in `models.py`, and re-check every place that sums or filters by
`paid_at` (`reports.py`, `get_revenue`) for NULL handling.

**Worth noting:** nothing in the backend writes NULL yet — both write paths still set `paidAt`
unconditionally. So this will pass today and break the day he adds a real unpaid flow. That is
exactly the kind of bug worth fixing while we can see it.

**`Payment.membershipId` was NOT added.** The `membership_id` you saw is on `attendances` and
`visits`. So "revenue by plan" stays a stopgap that matches on price. Ask #6 is still open.

## 1.4 The STAFF role — a decision we now have to make

New `staffs` table (its own login, refresh tokens, action tokens, notifications), a `STAFF` value
in the `Role` enum, and a **sixth and seventh JWT secret pair**. Staff belong to a gym through
`staffs.admin_id`, and `staff_id` is now stamped on members, memberships, payments, feedback and
attendance — "which employee did this".

**Today a staff token gets a flat 401 from us**, because we try the ADMIN secret and the MEMBER
secret and nothing else. That is safe, but it is now wrong: staff are the people at the front desk,
which is exactly where the assistant is most useful ("is this member allowed in?", "who is expiring
this week?").

This also changes a note in `PLAN.md`: the owner-sees-revenue / staff-doesn't split was recorded as
*not supported by the model*. It is supported now, and it is the natural third scope — a staff
agent with the member-management tools but **no revenue tools**, which is a clean, demonstrable
permission boundary and lines up with the team's "advanced permissions" module.

**Decision needed before the member agent (D26):** support STAFF as a third agent, or reject it
explicitly with a clear message instead of a bare 401. If we support it, we need the staff ACCESS
secret from Dahani, a `resolve_staff` in `tenancy.py`, a `Scope` that is gym-wide but revenue-blind,
and a third tool registry. That is roughly a day.

## 1.5 Opening hours became data — this changes phase 3

`working_hours` (per weekday, with `is_closed`) and `special_hours` (date ranges, with NULL times
meaning closed all day). Until now, "when are you open?" was a **RAG** question answered from the
seeded policy documents.

It should not be any more. Structured data beats retrieval for a question with an exact answer, and
a document that says 06:00–22:00 while the table says otherwise makes the assistant contradict
itself. Two consequences:

- A small `get_opening_hours` tool, and the generated documents should stop stating hours (or state
  them from the table, as the price documents already do).
- The knowledge branch loses one of its better demo questions. Guest policy, refunds, freeze rules
  and the staff handbook remain, so the RAG demo is fine — but worth knowing now rather than at D24.

## 1.6 `membership_plans.weekly_visit_limit` (breaking for the seeder)

NOT NULL, no default, so every plan INSERT must supply it. It also unlocks a good member question:
*"how many sessions do I have left this week?"* — which needs the limit, the plan, and this week's
attendance count. That is one tool and it is the most useful thing a member can ask.

## 1.7 `visits` — new data, and one table we must not read

Bookings with a status (`READY`/`CHECKED_IN`/`CANCELLED`/`EXPIRED`), a scheduled time, a 30-minute
expiry, and `qr_token_hash`.

**`visits.qr_token_hash` must never be granted to `ai_readonly`** — it is a credential that opens a
gym door, the same category as the refresh-token tables. Grant the other columns column-by-column,
the way `members` is done.

What visits give us: **no-shows**. A booking that stays `READY` and never becomes `CHECKED_IN` is a
member who planned to come and didn't, which is an earlier churn signal than absence alone. Worth a
tool once the data exists.

## 1.8 Task list this produces, in order

**Done 2026-09-20** (`verify.sh` 639 checks, passing, live model included):

1. ✅ Shadow SQL deleted, his migrations applied, contract re-pointed at `attendances`, grants narrowed, service boots.
2. ✅ `paid_at` / `due_date` optional in the read models; every consumer guards for `None`.
3. ✅ Seeder writes `visits` + `attendances` and clamps to `weekly_visit_limit`; catalogue carries the limit.
4. ✅ Validity rule adopted across models, reports, tools and the profile — and it caught two live bugs (superseded memberships in the renewal list; the wrong plan named after a downgrade).

**Still to do:**

5. **Decide STAFF.** If yes, it is a phase of its own: his staff ACCESS secret, a `resolve_staff` in `tenancy.py`, a gym-wide but revenue-blind `Scope`, and a third tool registry. Roughly a day.
6. **Add `get_opening_hours`** and stop stating hours in the generated documents. `working_hours` / `special_hours` are not granted yet — that grant is part of the task.
7. **Revisit revenue** once he answers the `payment_status` question (finding 1).

---

# Part 2 — For Dahani

## 2.1 What he fixed

- **The member cap off-by-one is fixed** (`>=`). 
- **`paidAt` and `dueDate` are nullable** — ask #9 delivered.
- The attendance indexes are exactly what was asked for, plus two more.
- `AccessesService` is a real improvement: tenancy resolution and the subscription check now live in one place instead of being copy-pasted per service.

## 2.2 One of my open questions is now answered by his own code

`AccessesService.validateActiveMembership` requires **`membershipStatus = ACTIVE` AND `expiresAt > now`**.

That settles Finding B: a membership set to `EXPIRED` by a plan change is dead immediately, not
honoured to its paid date. So our rule is the same as his: `valid ⇔ status = 'ACTIVE' AND
expires_at > now`. Guardrail #6 still holds — expiry still comes from the date; the status only
ever narrows.

**Remaining request, now small:** when a plan change supersedes a membership, set `expiresAt` to
`now` as well as the status. Otherwise the row keeps claiming an end date that is no longer real,
and anything reading dates rather than statuses — reports, exports, my tools — has to special-case it.

## 2.3 Still open from the last review

| # | Issue | Status |
|---|---|---|
| 1 | `payment_status` overwrites the record that money was collected | **unchanged** — and now more fixable, since `paidAt` is nullable: set it only when cash is taken, and revenue becomes "rows with a `paid_at`" |
| 3 | Plan-change transaction not atomic | **unchanged** — the callback still creates the membership and the payment through `this.prisma`, not `tx` |
| 4 | Plan change expires an arbitrary membership | **unchanged** — `findFirst` still has no `orderBy` and no status filter, though `validateActiveMembership` next door shows the right pattern |
| 5 | A missed cron run leaves a payment `PAID` forever | **unchanged** — refactored to `date-fns`, same one-day window |
| 6 | Verification email re-sent at login carries a token that was never stored | **unchanged, and now duplicated** for staff login |
| 7 | Password reset does not revoke refresh tokens | **unchanged** |

## 2.4 New findings in this release

### A. The 30-minute visit window is not enforced — Medium

`Visit.visitDateAndTimeExpiresAt` is set to booking time + 30 minutes, but check-in only checks
that a visit exists **today** and that its status is `READY`. A member who booked 09:00 can check
in at 22:55. Either enforce the window at check-in or drop the column, because right now it
documents a rule that is not applied.

### B. Nothing ever writes `EXPIRED` or `CANCELLED` on a visit — Medium

`visitStatus` only ever moves to `CHECKED_IN`. There is no cron expiring stale bookings and no
cancel path, so `READY` accumulates forever and "did this member show up?" cannot be answered from
the status. This is the same shape as the membership-status problem: an enum with states no writer
produces. A small hourly job — `READY` and `visitDateAndTimeExpiresAt < now` → `EXPIRED` — fixes it
and gives you no-show data for free.

### C. Manual check-in requires a pre-booked visit — product question

`confirmCheckIn` throws *"No visit found for today"* when a member walks in without booking, so
staff cannot check in a walk-in at all. Is that the intent? If yes, the error message should say so
to the person at the desk. If not, manual check-in should create the visit it needs.

### D. The booking limit counts attendances, not bookings — Low

`createVisit` compares the week's **attendance** count against `weeklyVisitLimit`. A member can
therefore book every day of the week and only be stopped at the door. Counting `READY` +
`CHECKED_IN` visits for the week would refuse the booking up front, which is friendlier and avoids
someone turning up to be turned away.

### E. Empty results throw 404 — Low, but it spreads

`findAllVisitsToday` throws *"There No Visits Today"* when the list is empty, and the same pattern
is in members, memberships and payments. An empty list is a valid answer, not an error: the
frontend has to treat a 404 as "zero", which means it cannot distinguish that from a genuinely
missing endpoint or a bad id. Return `[]`.

### F. Race on double check-in, already saved by a constraint — informational

Two simultaneous QR scans can both pass the "already checked in?" read before either writes, under
Postgres' default isolation. The unique constraint on `attendances.visit_id` stops the duplicate
anyway, so the outcome is correct — but it surfaces as a constraint error rather than the friendly
message. Worth catching it and returning the same *"already checked in today"* response.

## 2.5 What I still need from him

1. **The STAFF access-token secret**, if staff are to use the assistant — plus a decision on whether they should.
2. **`Payment.membershipId`** (ask #6), still the only way "revenue by plan" stops being a guess.
3. **Finding 1's answer**: now that `paidAt` is nullable, is it free to stop rewriting `payment_status` for collected payments?
4. **The staging/production ACCESS secrets**, for ADMIN and MEMBER, unchanged from the earlier ask.
5. **The `/internal/sentiment` call** on feedback creation, whenever he reaches it — the contract is in `AI_SPECS.md` §3.4, and note that his enum is uppercase while the JSON is lowercase, so one side maps.
