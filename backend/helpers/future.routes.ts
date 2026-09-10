// * Remove Check if element is exist befor do an action and use try catch
// * Test to remove an Admin

// * Upgrade a membership-plan of member
// * Upgrade a plan

// * Update membership-plan (should membership update to or not)
// * Update plan (should subscription update to or not)
// * update member

// * Delete membership-plan
// * Delete plan
// * Delete member

// * Ban any user by owner or make him pending
// * Cancel the subscription by owner or disactive
// * Ban or Frozen a member by admin
// * Disactive a plan by Owner
// * Disactive a membership plan by Admin

// * GET all members / One member
// * GET all membership-plan / One membership-plan
// * GET all plan / One plan
// * GET all subscription / One subscription
// * GET all payment / One payment
// * GET all membership / One membership
// * GET all notification / One notification

// * Make expire time get from .env

// * Login of member
// * Resend the set password email of member
// * change password of member
// * track plan of member (ui ux of member not admin)
// * track plan of admin (ui ux of admin not member)
// * @@unique([id, planId]) and @@index and all props that has @@ in prisma
// * add profile image of member (ui ux of member not admin)

// * make refresh token revok in logout

// * Logic code of payment
// * Cron of notifications

// * Enable Cors

// * Logic code Logout

// * Give the auth to any one to see plans (in landing page)

// * Give the auth to member to see payments

// * Check Roles in user controller

// * Change UserType of User to member is better

// * Understand how is email work

// * CRSF check documentation of NESTJS

// * check admin of gym when he try to add members has more palace depend on his plan or subscription
// * Check Down grade of plans of admin of gym by number of members

// * add props of all routes in swagger

// ! Create Staff by admin
// ! Add Staff role
// ! Make company name added auto
// ! Add default image profile to staff

// ! Check All Crons is Work
// ! Check All Crons of Notifications is Work

// Common Types
// Type	Meaning
// feat	New feature
// fix	Bug fix
// refactor	Code improvement without changing behavior
// docs	Documentation changes
// test	Add/update tests
// style	Formatting, linting
// chore	Maintenance tasks
// perf	Performance improvements
// build	Build system changes
// ci	CI/CD changes

// Good Examples
// git commit -m "feat: add plan duration entity"

// git commit -m "feat: allow users to select subscription duration"

// git commit -m "fix: validate plan duration uniqueness"

// git commit -m "refactor: move duration validation to service layer"

// git commit -m "chore: regenerate Prisma client"

// find . \
//   -type f \
//   -not -path "*/node_modules/*" \
//   -not -path "*/dist/*" \
//   -not -path "*/build/*" \
//   -not -path "*/generated/*" \
//   -exec cat {} + | wc -l

// | Prisma Function       | Returns if Nothing Found | Throws Prisma Error?    | Should Use `try...catch`? | Notes                                                  |
// | --------------------- | ------------------------ | ----------------------- | ------------------------- | ------------------------------------------------------ |
// | `findUnique()`        | `null`                   | ❌ (not for "not found") | ❌ Usually No              | Check `if (!result)` yourself.                         |
// | `findUniqueOrThrow()` | —                        | ✅ `P2025`               | ✅ Yes                     | Throws if record doesn't exist.                        |
// | `findFirst()`         | `null`                   | ❌ (not for "not found") | ❌ Usually No              | Check `if (!result)` yourself.                         |
// | `findFirstOrThrow()`  | —                        | ✅ `P2025`               | ✅ Yes                     | Throws if record doesn't exist.                        |
// | `findMany()`          | `[]`                     | ❌                       | ❌ No                      | Empty array is normal.                                 |
// | `count()`             | `0`                      | ❌                       | ❌ No                      | Zero is normal.                                        |
// | `aggregate()`         | Depends                  | ❌                       | ❌ No                      | No "not found" error.                                  |
// | `groupBy()`           | `[]`                     | ❌                       | ❌ No                      | Empty array is normal.                                 |
// | `create()`            | —                        | ✅ Yes                   | ✅ Yes                     | Can throw `P2002` (unique constraint), FK errors, etc. |
// | `createMany()`        | `{ count }`              | ✅ Yes                   | ✅ Yes                     | Can throw DB errors.                                   |
// | `update()`            | —                        | ✅ `P2025` + others      | ✅ Yes                     | Throws if record doesn't exist.                        |
// | `updateMany()`        | `{ count }`              | ❌                       | ❌ Usually No              | `count` may be `0`.                                    |
// | `upsert()`            | Record                   | ✅ Yes                   | ✅ Yes                     | Can throw DB errors.                                   |
// | `delete()`            | —                        | ✅ `P2025`, `P2003`      | ✅ Yes                     | Throws if record doesn't exist or FK constraint fails. |
// | `deleteMany()`        | `{ count }`              | ❌                       | ❌ Usually No              | `count` may be `0`.                                    |
// | `$transaction()`      | Depends                  | ✅ Yes                   | ✅ Yes                     | Whole transaction can fail.                            |
// | `$queryRaw()`         | Depends                  | ✅ Yes                   | ✅ Yes                     | Raw SQL can fail.                                      |
// | `$executeRaw()`       | Number                   | ✅ Yes                   | ✅ Yes                     | Raw SQL can fail.
//

// * TESTS
// * Delete user (admin)
// * Update user (user)
