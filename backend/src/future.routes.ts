// * Upgrade a membership-plan of member
// * Upgrade a plan

// ! Update membership-plan
// ! Update plan
// * update member

// ! Delete membership-plan
// ! Delete plan
// * Delete member

// ! Ban any user by owner or make him pending
// ! Cancel the subscription by owner
// ! Ban or Frozen a member by admin
// ! Disactive a plan by Owner

// * GET all members / One member
// * GET all membership-plan / One membership-plan
// * GET all plan / One plan
// * GET all subscription / One subscription
// * GET all payment / One payment
// ! GET all notification / One notification

// ! Login of member
// ! change password of member
// ! track plan of member (ui ux of member not admin)
// ! add profile image of member (ui ux of member not admin)

// ! Logic code of payment
// ! Logic code of notifications

// * check admin of gym when he try to add members has more palace depend on his plan or subscription
// * Check Down grade of plans of admin of gym by number of members

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
