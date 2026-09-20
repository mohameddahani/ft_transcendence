# Backend findings — from the AI layer

*Found 2026-09-16 by Oussama, reading the backend at commit `0fbb196`. Companion to
`SCHEMA_ASK_DAHANI.md`, which holds the schema asks; this file holds behaviour.*

## Why I was reading this code

The AI service reads your database directly and never writes to it. To answer "what was our
revenue in March" or "who is expiring this week", it has to know what each column *means* — and
the meaning of a status column is decided by the code that writes it, not by the schema. So I read
every writer of `memberships.membership_status` and `payments.payment_status`: `members.service.ts`
and the cron jobs.

Most of what I found is fine, and some of it is better than fine — the action-token flows check
`usedAt` and `expiresAt` and mark the token used inside a real transaction, refresh tokens are
hashed and revocable by `jti`, and separate secrets per role is the right call. What follows is
what I could not make work, plus two questions where I need your intent before the AI layer can be
correct.

**Everything below was read from the code, not reproduced at runtime**, unless it says otherwise.
If I have misread something, that is useful to know too — say so and I will fix my side.

## What I need most

1. **What does `payment_status` mean** — that a period is due for renewal, or that money was
   received? (Finding 1.)
2. **When a member changes plan, is the old membership dead immediately, or honoured until its
   `expiresAt`?** (Finding 2.)

Everything else is a bug report you can take or leave.

| # | Issue | Severity |
|---|---|---|
| 1 | The payment lifecycle erases the record that money was collected | High |
| 2 | Plan change writes `EXPIRED` on a membership whose `expiresAt` is in the future | High (semantics) |
| 3 | The plan-change transaction is not atomic | High |
| 4 | Plan change expires an arbitrary membership | Medium |
| 5 | A missed cron run leaves a payment `PAID` forever | Medium |
| 6 | Re-sent verification email carries a token that was never stored | Medium |
| 7 | A password reset does not revoke existing sessions | Medium |
| 8 | Member limit is off by one | Low |
| 9 | Account enumeration on register and forgot-password | Low |
| 10 | Notification cron: ordering and repeats | Low |

---

## 1. The payment lifecycle erases the record that money was collected — High

**What the code does.** A payment is only ever created in one state, `PAID`, at the moment cash is
taken at the desk:

- `modules/members/members.service.ts:137-146` (new member)
- `modules/members/members.service.ts:287-296` (plan change)

with `paidAt = membership.startDate` and **`dueDate = membership.expiresAt`**.

Then `jobs/payment.cron.ts` rewrites that row:

```ts
// noon: PAID -> OVERDUE, where dueDate falls tomorrow
// midnight: OVERDUE -> UNPAID, where dueDate has passed
```

Since `dueDate` is the membership's expiry, every payment ends its life as `UNPAID` — including
payments for which the member definitely handed over cash.

**Why this matters.** The row is the only record that money changed hands, and it is overwritten.
Concretely, for a member who joined in March on a one-month plan and paid in full:

| When | `payment_status` | Truth |
|---|---|---|
| March 1 | `PAID` | money received ✅ |
| March 30, noon | `OVERDUE` | money received; renewal approaching |
| April 1 | `UNPAID` | money received ❌ |

So today, a year later, that payment reads `UNPAID`. Any honest revenue query — `SUM(amount) WHERE
payment_status = 'PAID'` — returns **zero** for every month older than the longest plan you sell.
The member's own payment history also shows `UNPAID` for a period they paid for, which is the kind
of thing a member takes a screenshot of.

I hit this because the AI's revenue tools filter on `PAID`. I can change my side in a day, but only
once I know which of these you intend.

**What I think is happening.** `payment_status` is being used for two different things at once:
*was this invoice settled* (what the enum names say) and *is this member due to renew* (what the
cron and the notification message actually do). One column cannot carry both.

**Options, in the order I would pick them:**

1. **Treat `payments` as an immutable cash ledger.** A row means "this much money was received on
   this date". Nothing ever rewrites its status. "Is this member due to renew?" is then a question
   about `memberships.expiresAt`, which already answers it exactly — the payment cron can go away,
   and the notification cron can select memberships expiring in the next N days instead. This is
   also what makes `Payment.membershipId` (ask #6 in `SCHEMA_ASK_DAHANI.md`) worth adding: with it,
   "revenue by plan" becomes a join instead of guesswork.
2. **Keep the status, but add a field that does not move** — `collectedAt DateTime?` or
   `isCollected Boolean` — and let revenue read that. Less invasive, but you now have two sources
   of truth about the same event.

Either way, `paidAt` should become nullable (ask #9): today an unpaid row must still carry a
payment date, which asserts money arrived on a day nobody paid.

---

## 2. Plan change writes `EXPIRED` on a membership whose `expiresAt` is in the future — High (semantics)

**What the code does.** `modules/members/members.service.ts:263-270`:

```ts
await tx.membership.update({
  where: { id: membership.id },
  data: { membershipStatus: MembershipStatus.EXPIRED },
});
```

The old membership's `expiresAt` is left untouched, so a member who upgrades on day 10 of a 90-day
plan has a row saying `EXPIRED` with `expiresAt` 80 days in the future.

**Why this matters to me.** `membershipStatus` is maintained by `jobs/membership.cron.ts`, so the
AI layer is built to never trust it for expiry — a missed cron run would otherwise report a lapsed
member as current. It derives everything from `expiresAt` instead, and treats only `CANCELLED` as a
status a person sets deliberately. Because of this line, a member who changed plan has **two**
memberships that look valid:

- they appear twice in the renewal-chase list, so staff call someone who already renewed;
- after a downgrade, "what plan am I on?" answers with the old, longer one, because it has the
  later `expiresAt`;
- my drift check reports it as a failed cron job.

**The question.** When a member switches plan, is the old membership dead immediately, or is it
honoured until the date it was paid for? Both are defensible; the data has to say which.

**If it is dead immediately**, then set the date too, so status and date agree:

```ts
data: { membershipStatus: MembershipStatus.EXPIRED, expiresAt: new Date() }
```

That single change makes every reader correct, mine included, with no coordination.

**If it is honoured until `expiresAt`**, then `EXPIRED` is the wrong word for it — it is superseded,
not expired — and I need a way to tell the two apart. `CANCELLED` already exists in the enum and is
currently written by nothing.

---

## 3. The plan-change transaction is not atomic — High

**What the code does.** `modules/members/members.service.ts:263-300`. The callback receives `tx`,
but only the first statement uses it:

```ts
await this.prisma.$transaction(async (tx) => {
  await tx.membership.update({ ... });              // inside the transaction
  const newMembership = await this.prisma.membership.create({ ... });  // line 273 — outside
  await this.prisma.payment.create({ ... });        // line 287 — outside
});
```

`this.prisma` is the client, not the transaction, so those two writes commit immediately and are
not rolled back if anything afterwards fails.

**Concrete failure.** The new membership is created, then `payment.create` throws — a constraint,
a dropped connection, a timeout. Prisma rolls back the transaction, which undoes *only* the
`EXPIRED` update. The member is left with two memberships both looking active and no payment
recorded for the new one. Nothing in the API surface reports this, and the next person to notice is
whoever reads the numbers.

**Fix:** use `tx` for all three statements. Worth a grep for the same shape elsewhere —
`$transaction(async (tx) =>` with `this.prisma` inside is easy to write by accident. The array form
used in `activateAccount` and `resetPassword` is immune to this, which is why those two are fine.

---

## 4. Plan change expires an arbitrary membership — Medium

**What the code does.** `modules/members/members.service.ts:252-258`:

```ts
const membership = await this.prisma.membership.findFirst({
  where: { adminId, memberId },
});
```

No `orderBy`. Postgres returns rows in whatever order it likes, so for a member with a history —
and in our seeded data most members have three to five memberships — this can pick one from 2024.

**Consequence.** The already-expired 2024 row is set to `EXPIRED` again (no-op), while the
membership the member is actually on stays `ACTIVE` with its original `expiresAt`. Combined with
the new membership, the member now has two genuinely active memberships and staff have no signal
that anything is wrong.

**Fix:** select the membership deliberately — the current one:

```ts
const membership = await this.prisma.membership.findFirst({
  where: { adminId, memberId, membershipStatus: MembershipStatus.ACTIVE },
  orderBy: { expiresAt: 'desc' },
});
```

---

## 5. A missed cron run leaves a payment `PAID` forever — Medium

**What the code does.** `jobs/payment.cron.ts:10-35` selects only payments whose `dueDate` falls
inside **tomorrow**:

```ts
where: { paymentStatus: PAID, dueDate: { gte: startOfTomorrow, lte: endOfTomorrow } }
```

**Consequence.** That one-day window has to be hit by exactly one run. If the container is
restarting at noon, or the job throws on one bad row, or a deploy happens over lunch, those
payments are never picked up again — their `dueDate` is in the past the next day, and the query no
longer matches them. They stay `PAID` for good and their members are never notified.

A scheduled job should be **idempotent and catch-up safe**: express it as a state to converge on,
not as an event to catch.

```ts
// everything already due, regardless of when we last ran
where: { paymentStatus: PAID, dueDate: { lte: endOfTomorrow } }
```

The same pattern applies to the midnight job. `membership.cron.ts` and `subscription.cron.ts`
already do it the right way (`expiresAt: { lte: new Date() }`), which is a good model.

---

## 6. Re-sent verification email carries a token that was never stored — Medium

**What the code does.** `modules/auth/auth.provider.ts:157-171`. When an `INACTIVE` user tries to
log in, a fresh token is generated and emailed:

```ts
const { rawToken, tokenHash } = this.generateActionToken();
await this.emailService.sendVerificationEmail(user.email, rawToken);
```

`tokenHash` is never written to `user_action_tokens`. `register` does this correctly at `:120`, and
`forgotPassword` at `:750` — this one path does not.

**Consequence.** `activateAccount` hashes the incoming token and looks it up (`:675-682`); there is
no row, so it answers *"Invalid token"*. The user receives an email whose link cannot work. They
will keep clicking it, because it looks exactly like the one that does. (The original registration
email still works until it expires, which is what makes this intermittent and confusing rather than
obviously broken.)

**Fix:** store the hash before sending, as `register` does. TypeScript would have caught this with
`noUnusedLocals`, since `tokenHash` is assigned and never read.

---

## 7. A password reset does not revoke existing sessions — Medium

**What the code does.** `resetPassword` (`:767-812`) updates the password and marks the token used,
in a proper transaction. It does not touch `user_refresh_tokens`.

**Consequence.** The usual reason someone resets a password is that somebody else got in. After the
reset, that person's refresh token still works for its full lifetime, and they can mint new access
tokens indefinitely. The legitimate owner has no way to end the session.

**Fix:** in the same transaction, revoke that user's refresh tokens:

```ts
this.prisma.userRefreshToken.updateMany({
  where: { userId: token.user.id, revokedAt: null },
  data: { revokedAt: new Date() },
}),
```

Same for `resetPasswordMember` and `member_refresh_tokens`. Worth doing on `setPasswordMember` too.

---

## 8. Member limit is off by one — Low

`modules/members/members.service.ts:47`:

```ts
if (membersCount > subscription.plan.maxMembers) { throw ... }
```

At exactly `maxMembers` members the check passes, so a plan capped at 100 admits 101. Should be
`>=`.

---

## 9. Account enumeration on register and forgot-password — Low

- `register` (`:51-60`) answers *"Email already exists"* or *"Phone number already exists"*.
- `forgotPassword` (`:734`) answers *"Invalid Email"* when no account matches.

Both let anyone test an address or a phone number for membership of the platform. The usual
handling is to answer the same way in both cases — "if that address is registered, we have sent a
link" — and let the email itself carry the difference.

Both also throw `UnauthorizedException` (401) for what is a conflict (409) or simply a success with
no side effect. Same in `checkIfAdminHasSubscription`, where a lapsed subscription answers 401
rather than 402/403 — a client cannot distinguish "log in again" from "pay us", and both my service
and the frontend have to branch on the message text instead of the status.

---

## 10. Notification cron: ordering and repeats — Low

`jobs/membership-notification.cron.ts` and the first job in `jobs/payment.cron.ts` are both
`EVERY_DAY_AT_NOON`. The notification job reads the `OVERDUE` rows that the payment job writes, and
nothing orders the two, so on any given day the notification may run first and go out 24 hours
late.

It also creates a new `MemberNotification` for every `OVERDUE` payment on every run, with no check
for one already sent, so a payment that stays `OVERDUE` across two runs notifies the member twice.
A `@@unique` on (member, type, day) — or simply checking before inserting — would fix it.

If Finding 1 goes the "immutable ledger" way, this job becomes a query over `memberships.expiresAt`
and both problems disappear.

---

## Still open from `SCHEMA_ASK_DAHANI.md`

Not repeated here, but still blocking on my side:

- `CheckIn` and `Feedback` models with their indexes — I am running a shadow copy locally
  (`AI/seeder/pending/001_check_ins_feedbacks.sql`) that matches what `prisma migrate dev` will
  generate. When yours lands I drop mine.
- `Payment.membershipId` (nullable) — without it, "revenue by plan" is matched on price, which
  breaks the day two plans in one gym cost the same.
- `Payment.paidAt` nullable — see Finding 1.
- The `POST /internal/sentiment` call on feedback creation, when you get there. It must not block
  or fail feedback creation if my service is down: store the feedback unscored and my batch job
  will pick it up.
