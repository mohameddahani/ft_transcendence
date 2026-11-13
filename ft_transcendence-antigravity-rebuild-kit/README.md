# ft_transcendence — Antigravity frontend rebuild kit

Use this kit with Gemini 3.1 Pro — High in Google Antigravity to redesign your existing frontend from one reference image, extend that style across the existing pages, and fix confirmed frontend logic bugs.

This kit contains instructions and a reference. It does not contain a rebuilt application and has not audited your repository.

## 1. What you received

| File in this kit | Purpose |
| --- | --- |
| AGENTS.md | Persistent project rules to apply before frontend changes |
| docs/frontend-rebuild/FRONTEND_REDESIGN_PROMPT.md | The complete master task: audit, design system, all-page implementation, bug fixes, verification |
| docs/frontend-rebuild/DESIGN_BRIEF.md | How to turn the single dashboard image into consistent list, form, detail, auth, and public-page designs |
| docs/frontend-rebuild/FRONTEND_PRODUCTION_REQUIREMENTS.md | The 107-point checklist from our research, including source references and verification guidance |
| docs/frontend-rebuild/design-reference.jpg | Your supplied design photograph |
| README.md | These setup and usage instructions; keep it with the kit |

The revised rules and master prompt extend the earlier files from our chat. Use this version consistently for this mission, rather than mixing old prompts and paths.

## 2. Important interpretation of your requirements

The standard shadcn setup uses Tailwind and outputs real HTML. The kit translates your preference into shadcn controls, semantic HTML structure, required Tailwind support in the UI layer, and CSS Modules/shared tokens for new page layouts. [Official shadcn setup](https://ui.shadcn.com/docs/installation/manual)

Browser validation improves feedback. Actual protection also requires trusted server validation, authorization, secure sessions, safe rendering, and correct data boundaries. The kit authorizes frontend-owned fixes and requires precise reporting of backend gaps.

"Fix all bugs" means investigate and fix confirmed frontend defects found through the audit and rollout, with evidence. It cannot mean proving that no possible bug remains.

## 3. Prepare the existing repository

1. Open your actual ft_transcendence repository.
2. Preserve existing work and check the current branch/status.
3. Create a dedicated branch if a suitable rebuild branch does not already exist.

Example commands from the repository root:

~~~bash
git status --short
git switch -c feat/frontend-rebuild
~~~

If the branch already exists, use it deliberately or choose a new name. Do not discard another contributor's uncommitted work.

Keep your existing backend, database, routes, and integrations. The agent works on the frontend visual layer and its actual logic; it does not scaffold a replacement application or silently migrate the backend.

## 4. Install the files

Extract the ZIP into a temporary folder first, then copy/merge only these paths into the repository:

| Kit path | Destination |
| --- | --- |
| AGENTS.md | Repository root, alongside your backend/frontend/devops directories where applicable |
| docs/frontend-rebuild/ | Repository root's docs/frontend-rebuild/ directory |

If a destination file already exists, merge the guidance rather than blindly overwriting it. Preserve existing rules that still apply and resolve genuine conflicts deliberately.

Keep the kit README.md outside your project's root README.md. It explains the rebuild setup; it is not a replacement for your project's normal README.

The image should now be at docs/frontend-rebuild/design-reference.jpg. The agent needs access to that actual file. You can also attach it in the first chat as a convenient visual reference.

These are development documents. Keep them out of public/ and do not expose private data in them.

## 5. Make Antigravity apply the rules

Current Antigravity documentation recognizes a root AGENTS.md as continuously active project guidance without YAML frontmatter. Put it in the project folder or an applicable repository parent; open the repository root for the simplest setup.

In the IDE agent panel, use the menu, then Customizations, then Rules to inspect project guidance. Start a fresh conversation after installing the files.

Do not paste the same rules into several competing global/workspace files. The detailed checklist remains a supporting document rather than a giant inline always-on rule.

The current documented per-file rule limit is 24,000 bytes. The supplied AGENTS.md stays below it. Keep future additions focused. [Antigravity rules documentation](https://antigravity.google/docs/rules/)

Rules provide context; tests and review still verify compliance.

## 6. Select your model

Choose Gemini 3.1 Pro and High thinking if those entries are available in your account.

The current official availability table lists Gemini 3.1 Pro under Enterprise. If it is absent, check your account and installed Antigravity version; the prompt itself cannot unlock a model. [Official model list](https://antigravity.google/docs/models/)

Use normal code-execution mode for the implementation. A plan-only session can inspect and plan, but must transition to an editing-capable mode to carry out the rebuild.

## 7. Start the rebuild

Choose either method below. You only need one.

### Method A — short kickoff message

Paste this into a fresh Antigravity conversation after installing the files:

~~~text
Use docs/frontend-rebuild/FRONTEND_REDESIGN_PROMPT.md as the master task for this mission.

Before any source/config change, read root AGENTS.md and the applicable project instructions. Read the design brief and production checklist, and visually inspect docs/frontend-rebuild/design-reference.jpg.

Rebuild the complete existing frontend from that single reference's design language. Design the other existing pages consistently for their real tasks, check the logic, and fix confirmed frontend bugs. Preserve intended business rules, API contracts, roles, club boundaries, translations, and integrations.

Start with the audit and baseline, then implement and verify coherent slices until the existing route inventory is covered. Keep progress, bug evidence, and validation results updated. Continue routine authorized work without asking for confirmation before each page.
~~~

### Method B — full prompt

Open docs/frontend-rebuild/FRONTEND_REDESIGN_PROMPT.md and paste the task between its horizontal separators into the conversation.

Attach/reference the photograph if the agent has trouble locating it. Verify that the project includes the docs folder and frontend source.

The master prompt already instructs the agent to read the persistent rules, investigate actual code, and proceed through the implementation.

## 8. Check the first response

The agent should identify the loaded rules, image, scope, actual package manager/router, and initial audit findings before source edits.

Check that it understands:
- All existing frontend routes are in scope, not only the dashboard.
- The photograph defines the shared design language; other pages need task-appropriate layouts.
- Confirmed frontend logic bugs should be fixed and verified.
- Backend/API/schema changes are outside the default write scope.
- A plan or screenshot alone is not completion.

It can write audit/progress documents while inspecting the code. It should proceed to implementation after the baseline, without waiting for approval of every routine decision.

## 9. What the agent should produce

| Stage | Expected output |
| --- | --- |
| Audit | Actual route inventory, baseline check results, observed issues, blockers |
| Shared foundation | Tokens, components, navigation, representative dashboard and form/list |
| Route rollout | Existing pages implemented consistently, real integrations preserved, confirmed defects fixed |
| Final checks | Role/club/session/form review, browser checks, build/types/lint/tests, honest performance evidence |
| Handoff | Progress, bug log, validation report, remaining known issues and exact reproduction/check steps |

It must maintain these files under docs/frontend-rebuild/:
- AUDIT.md
- DESIGN_SYSTEM.md
- ROUTE_INVENTORY.md
- BUG_LOG.md
- VALIDATION_REPORT.md
- PROGRESS.md

They are created from repository evidence; this kit does not fill them with invented routes, bugs, test results, or metrics.

## 10. How the one-page reference is extended

The agent extracts shared tokens and patterns, then designs each page according to its purpose.

Examples:
- A member list uses the same shell/type/controls with practical filters, a table/list, and real actions.
- An edit form uses the same visual system with grouped fields and clear validation.
- A member detail view groups identity, status, and actual related information.
- Auth pages retain the identity while using a focused login/recovery layout.
- Public pages share the brand without forcing a dashboard sidebar onto marketing content.

Review the working slice early. The default instruction is to continue the full rebuild. If you want a deliberate visual approval stop, add: "Pause after the first working desktop/mobile dashboard and form so I can review the direction."

## 11. How bugs should be handled

A useful bug record contains the trigger, expected/actual behavior, affected file/route/role, root cause, fix, and verification result.

For example, "Search sometimes displays an older response after a newer query" should lead to a reproducible request-order case, a correct cancellation/stale-result fix, and a regression check.

The agent should not rename a business rule as a bug without evidence. Backend authorization, missing endpoints, and server duplicate protection may require separate work; it must log those gaps and continue independent frontend tasks.

A feature is not fixed merely because the error was hidden or its button was removed.

## 12. Resume after a limit or a new conversation

Paste:

~~~text
Continue the frontend rebuild. Read root AGENTS.md, the master prompt, and the current PROGRESS.md, ROUTE_INVENTORY.md, BUG_LOG.md, and VALIDATION_REPORT.md under docs/frontend-rebuild/.

Keep the established design system and completed work. Choose the next unfinished coherent task, implement and verify it, update the records, and continue. Report genuine blockers without inventing successful tests or restarting the project.
~~~

If the agent loses the visual direction, point it back to DESIGN_BRIEF.md, design-reference.jpg, and DESIGN_SYSTEM.md.

If it stops after planning, say: "The plan is enough. Proceed with the authorized implementation and verification."

## 13. Package and environment notes

Your pasted package list is historical context, not a replacement package.json.

| Existing area | Required treatment |
| --- | --- |
| Next.js, React, TypeScript | Verify actual versions/router; keep the working framework |
| Next ^16.4.3 / eslint-config-next 16.3.5 in the old snippet | Check resolved compatibility and align deliberately if necessary |
| shadcn, Base UI, CVA, cn, lucide | Inspect actual components/configuration before adding alternatives |
| Tailwind/PostCSS/tw-animate-css | Retain the parts required by the actual component setup |
| react-hook-form, Zod, resolver | Reuse compatible forms and actual API constraints |
| axios | Preserve the existing client/session/error flow |
| i18next/react-i18next | Preserve languages and RTL where supported |
| react-toastify | Keep one themed notification system |
| framer-motion | Use where useful; simple effects can use CSS |
| ethers/html5-qrcode | Preserve behavior and load only on relevant routes |

Use your repository's existing setup instructions to run the frontend/backend and configure local environment variables. Do not paste private .env files or production credentials into prompts or logs.

If authenticated browser tests require accounts, use approved local/staging test accounts. The agent must distinguish code inspection, mocked UI tests, and real integration tests.

## 14. Your final review

Before merging the rebuild, check the actual application:
1. Does the reference's visual character carry across multiple different page types?
2. Do login, member search, attendance, plans/payments, and affected integrations still work?
3. Are role-specific actions and club data boundaries preserved?
4. Do narrow screens, keyboard use, forms, errors, and translations work?
5. Are the build/lint/type/tests and measured results recorded honestly?
6. Are remaining defects or backend blockers clear?

The instructions require evidence and complete route coverage; they do not guarantee a model will discover every bug or prove the application secure.

## 15. Official setup references

- [Antigravity rules](https://antigravity.google/docs/rules/)
- [Antigravity model availability](https://antigravity.google/docs/models/)
- [shadcn manual installation](https://ui.shadcn.com/docs/installation/manual)
- The full production checklist includes its own security, accessibility, performance, and testing sources.

Prepared 5 November 2026. This kit keeps the requested model name; actual availability is controlled by the account and platform.
