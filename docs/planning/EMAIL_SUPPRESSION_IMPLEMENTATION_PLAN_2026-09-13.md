# Email Suppression & Send-Preference Implementation Plan

**Created:** September 13, 2026
**Status:** Ready for implementation
**Scope:** `fotolokashen` (web). No iOS changes required.

---

## 0. Read This First

### 0.1 What problem are we solving?

Three separate defects, all in the outbound email path:

1. **No suppression list.** `email.bounced` and `email.complained` webhook events are recorded as free text in `EmailLog.errorMessage`, but nothing stops the next send to that address. We already have a live hard bounce (`allaccess@fotolokashen.com`). Repeatedly mailing dead addresses is the fastest way to damage sender reputation.

2. **`User.emailNotifications` is never enforced.** The field exists, defaults to `true`, is editable at Profile → Preferences, and is returned by both the web and iOS APIs — but **no code in the sending path reads it**. We show users a switch that does nothing.

3. **The `List-Unsubscribe` header is misconfigured.** It advertises RFC 8058 one-click unsubscribe (`List-Unsubscribe-Post: List-Unsubscribe=One-Click`) while supplying only a `mailto:` target. One-click requires an `https://` URI. Nothing processes the resulting mail, and the header is attached to password resets.

### 0.2 What we are NOT building

**Do not build an unsubscribe page, a preference center, or a token-signing endpoint.** Every email this app sends is transactional or relationship mail — verification, password reset, password changed, account deletion, email-change alerts, welcome, and support replies. There are no campaigns and no bulk sends. CAN-SPAM's opt-out requirement applies to commercial messages, so it does not attach here, and GDPR treats contract-performance mail as not consent-based.

The suppression list is a **deliverability and sender-reputation control**, not a legal unsubscribe mechanism. Keep the scope tight.

### 0.3 Ground rules for the implementing agent

- Work through the phases **in order**. Each phase ends green (typecheck + tests + build) before the next begins.
- One commit per phase.
- `next.config.ts` has `typescript.ignoreBuildErrors: false`. Type errors break the build. Run `npx tsc --noEmit` before every commit.
- Test runner is **Vitest** (`npm run test`). Existing unit tests live in `src/lib/__tests__/`.
- Follow the repo conventions in `.github/copilot-instructions.md`: snake_case DB columns via `@@map`, camelCase TypeScript, semantic color tokens in any UI.
- Database changes use `npm run db:push` in development, then `npm run db:generate`.
- **Do not** touch DNS, Resend dashboard settings, or environment variables. Those are handled separately.
- If a phase's design turns out to be wrong when you get into the code, **stop and report** rather than improvising a different architecture.

---

## 1. Design (decided — do not re-litigate)

### 1.1 Three send categories

Every outbound email is classified. The category determines which suppression reasons block it.

| Category        | Meaning                                                                                         | Examples                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `security`      | Account integrity. The user cannot safely be denied this.                                       | verification, password reset, password changed, account deletion, all email-change mail |
| `transactional` | User-initiated, not security-critical.                                                          | welcome, support ticket confirmation, internal support notifications                    |
| `notification`  | Discretionary. Nothing exists in this class today; future follow/comment/digest mail goes here. | —                                                                                       |

### 1.2 Enforcement matrix

| Suppression reason                  | `security` | `transactional` | `notification` |
| ----------------------------------- | ---------- | --------------- | -------------- |
| `hard_bounce`                       | **block**  | **block**       | **block**      |
| `complaint`                         | send       | **block**       | **block**      |
| `provider_suppressed`               | send       | **block**       | **block**      |
| `manual` (admin)                    | **block**  | **block**       | **block**      |
| `User.emailNotifications === false` | send       | send            | **block**      |

Rationale for the non-obvious cells:

- **Hard bounce blocks everything.** The mailbox does not exist. A password reset sent there is not merely useless, it is another reputation hit.
- **Complaint does not block `security`.** A complaint says "I did not want that mail," not "this address is dead." A user who subsequently requests a password reset must receive it.
- **`manual` blocks everything.** If an operator explicitly suppressed an address, honor it without exception.
- **`emailNotifications` never blocks `security` or `transactional`.** A preference toggle must never lock someone out of their own account or swallow a support reply they asked for.

### 1.3 Internal address protection

`EMAIL_REPLY_TO` and `SUPPORT_EMAIL` must **never** be suppressed. If the support inbox hard-bounces once, suppression would silently stop all inbound support ticket notifications and nobody would notice. Treat these as a permanent allowlist and log loudly if a suppression event names one.

### 1.4 Default category is `notification`

`notification` is the most restrictive class, so a call site that forgets to declare a category fails toward _not sending_ rather than toward sending. Phase 2 enumerates all 11 call sites explicitly and adds a test that locks the security-class mapping in place, so the default should never actually be hit by existing code.

---

## Phase 1 — Suppression store and pure classification logic

### Goal

Create the data model and a self-contained suppression module. **Nothing changes behavior in this phase** — no send is blocked, no webhook writes. This phase exists so that the logic is fully unit-testable before it is wired into anything that can break email delivery.

### Files

- `prisma/schema.prisma` (edit)
- `src/lib/email-suppression.ts` (new)
- `src/lib/__tests__/emailSuppression.test.ts` (new)

### 1.1 Schema

Add near `model EmailLog` (around line 498):

```prisma
model EmailSuppression {
  id     Int     @id @default(autoincrement())
  email  String  @unique // always normalized: trimmed + lowercased
  reason String // hard_bounce | complaint | provider_suppressed | manual
  detail String? @db.Text
  source String? // provider message id, webhook id, or admin user id

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([reason])
  @@index([createdAt])
  @@map("email_suppressions")
}
```

Then `npm run db:push && npm run db:generate`.

### 1.2 Module

`src/lib/email-suppression.ts` exports:

**Pure functions (no DB, no I/O — these carry the test coverage):**

- `normalizeEmail(email: string): string` — trim + lowercase.
- `isProtectedAddress(email: string): boolean` — true when the normalized address matches normalized `env.EMAIL_REPLY_TO` or `env.SUPPORT_EMAIL`.
- `isBlocked(category: EmailCategory, reason: SuppressionReason): boolean` — implements the matrix in §1.2 exactly.
- `classifyBounce(bounce: { type?: string; subType?: string }): SuppressionReason | null` — returns `"hard_bounce"` **only** when `bounce.type === "Permanent"` (case-insensitive). `Transient` and `Undetermined` return `null`. Suppressing a transient bounce would lock out a user whose mailbox was merely full.

**DB functions (thin wrappers, minimal logic):**

- `getSuppression(email: string): Promise<EmailSuppression | null>`
- `suppressEmail(input: { email; reason; detail?; source? }): Promise<void>` — no-ops and logs a warning when `isProtectedAddress()` is true; otherwise `upsert` on the unique `email`. On conflict, upgrade the reason if the incoming one is stricter (`hard_bounce` > `manual` > `complaint` > `provider_suppressed`), otherwise leave it.
- `unsuppressEmail(email: string): Promise<void>` — delete by normalized email.

Export the types:

```ts
export type EmailCategory = "security" | "transactional" | "notification";
export type SuppressionReason =
  | "hard_bounce"
  | "complaint"
  | "provider_suppressed"
  | "manual";
```

### Tests — `src/lib/__tests__/emailSuppression.test.ts`

Pure functions only; no DB mocking needed.

1. `normalizeEmail` trims whitespace and lowercases (`"  Foo@Bar.COM "` → `"foo@bar.com"`).
2. `isBlocked` — assert **all 16 cells** of the §1.2 matrix explicitly. Do not loop; write them out so a future regression names the exact cell that broke.
3. `classifyBounce` returns `"hard_bounce"` for `{ type: "Permanent" }` and for `{ type: "permanent" }`.
4. `classifyBounce` returns `null` for `{ type: "Transient" }`, `{ type: "Undetermined" }`, `{}`, and `undefined`.
5. `isProtectedAddress` returns true for the configured support address in mixed case, false for an unrelated address.

### Done when

- `npx tsc --noEmit` clean.
- `npm run test` passes, new suite included.
- `npx prisma studio` shows an empty `email_suppressions` table.
- **No behavioral change** — sending an email still works exactly as before.

---

## Phase 2 — Enforce suppression and preferences in `sendEmail()`

### Goal

Add a single enforcement chokepoint at the top of `sendEmail()` and classify all 11 existing call sites. After this phase, a suppressed address stops receiving mail and `User.emailNotifications` finally means something.

### Files

- `src/lib/email.ts` (edit)
- `src/app/api/support/route.ts` (edit — 1 call site)
- `src/app/api/member-support/route.ts` (edit — 2 call sites)
- `src/lib/__tests__/emailCategories.test.ts` (new)

### 2.1 Extend `SendEmailOptions`

```ts
category?: EmailCategory; // defaults to "notification"
```

### 2.2 Gate at the top of `sendEmail()`

Insert **before** the headers are built and before `getResendClient()` is called, so a blocked send never touches the Resend API:

1. `const normalized = normalizeEmail(to);`
2. Look up `getSuppression(normalized)`. If found and `isBlocked(category, suppression.reason)` → log to `EmailLog` with `status: "suppressed"` and `errorMessage: \`suppressed; reason=${reason}; category=${category}\``, then `return false`.
3. If `category === "notification"`, look up the user by normalized email. If the user exists and `emailNotifications === false` → log with `status: "suppressed"` and `errorMessage: \`suppressed; reason=user_preference; category=notification\``, then `return false`.

The user lookup runs **only** for `notification` mail, so today it costs nothing — no current call site is in that class.

Extract the `EmailLog` write into a small local helper; there are now three call sites for it (sent / failed / suppressed) and duplicating the try/catch a third time is noise.

Keep returning `boolean`. Callers already treat `false` as "did not send," and a suppressed send genuinely did not send. Do not change the signature.

### 2.3 Classify every call site

| Location                      | Function                              | Category        |
| ----------------------------- | ------------------------------------- | --------------- |
| `email.ts:208`                | `sendVerificationEmail`               | `security`      |
| `email.ts:259`                | `sendWelcomeEmail`                    | `transactional` |
| `email.ts:292`                | `sendPasswordResetEmail`              | `security`      |
| `email.ts:330`                | `sendPasswordChangedEmail`            | `security`      |
| `email.ts:381`                | `sendAccountDeletionEmail`            | `security`      |
| `email.ts:416`                | `sendEmailChangeVerification`         | `security`      |
| `email.ts:463`                | `sendEmailChangeAlert`                | `security`      |
| `email.ts:510`                | `sendEmailChangeConfirmation`         | `security`      |
| `support/route.ts:191`        | support notification → internal inbox | `transactional` |
| `member-support/route.ts:234` | support notification → internal inbox | `transactional` |
| `member-support/route.ts:242` | ticket confirmation → user            | `transactional` |

Note: `email.ts:452`, `:501`, and `:557` are the `return sendEmail(...)` lines inside the three email-change wrappers — that is where the category argument goes for those.

Several wrappers return early when `EMAIL_MODE === "development"` and never reach `sendEmail()`. That is fine and intentional; dev-mode console logging is unaffected by suppression.

### Tests — `src/lib/__tests__/emailCategories.test.ts`

This suite needs `vi.mock("@/lib/prisma")` and `vi.mock("resend")`. Follow the mocking style already used in `src/lib/__tests__/`.

1. **Hard bounce blocks a security email.** Suppression lookup returns `hard_bounce`; call `sendEmail(..., { category: "security" })`; assert it returns `false` and that the Resend send mock was **never called**.
2. **Complaint does not block a security email.** Suppression returns `complaint`; assert `sendEmail` with `category: "security"` returns `true` and Resend **was** called.
3. **Complaint blocks a transactional email.** Assert `false`, Resend not called.
4. **A suppressed send writes an `EmailLog` row** with `status: "suppressed"` and a `reason=` in `errorMessage`.
5. **`emailNotifications: false` blocks `notification` mail** but **does not block `transactional` or `security`** — three assertions.
6. **No user lookup for non-notification categories.** Assert `prisma.user.findUnique` was not called when category is `security`.
7. **Source-level guard (important):** read `src/lib/email.ts` from disk and assert that each of the seven security-class wrapper names is followed by a `category: "security"` within its body. This is the regression net that stops someone from adding a wrapper that silently inherits the `notification` default. A simple regex over the file source is sufficient.

### Done when

- `npx tsc --noEmit` clean, `npm run test` green, `npm run build` passes.
- Manual check with `EMAIL_MODE="production"` against Resend's sandbox addresses only:
  - `delivered@resend.dev` → sends.
  - Manually insert a `hard_bounce` row for a test address → next send returns `false` and logs `status: "suppressed"`.
- **Never test bounces against a real Gmail address.**

---

## Phase 3 — Populate suppressions from the webhook

### Goal

Close the loop: provider bounce and complaint events now write suppression records automatically.

### Files

- `src/app/api/webhooks/resend/route.ts` (edit)
- `src/lib/__tests__/emailSuppression.test.ts` (extend)

### 3.1 Extract recipients

The event payload's `data.to` is `string[]`. Suppress **each** recipient independently.

### 3.2 Event handling

Add a branch after the existing `EmailLog` write, before the handler returns:

| Event              | Action                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `email.bounced`    | `classifyBounce(data.bounce)`; if it returns `"hard_bounce"`, suppress each recipient with `detail` = bounce message and `subType`, `source` = webhook id |
| `email.complained` | suppress each recipient with reason `"complaint"`                                                                                                         |
| `email.suppressed` | suppress each recipient with reason `"provider_suppressed"` (mirrors Resend's own list)                                                                   |
| everything else    | no suppression                                                                                                                                            |

Wrap the suppression write in its own try/catch. A failure to suppress must **not** cause the webhook to return non-200 — Resend would retry the whole event and duplicate the `EmailLog` row.

Do **not** restructure the webhook in this phase. The early-200 refactor and the `errorMessage` LIKE-scan dedupe replacement are tracked separately (see §6) and touching them here would make the diff unreviewable.

### Tests

Extend the Phase 1 suite with pure-function coverage of a new exported helper `suppressionFromEvent(eventType, data): { reason, detail } | null`:

1. `email.bounced` with `bounce.type: "Permanent"` → `hard_bounce`.
2. `email.bounced` with `bounce.type: "Transient"` → `null`.
3. `email.bounced` with no `bounce` object → `null`.
4. `email.complained` → `complaint`.
5. `email.suppressed` → `provider_suppressed`.
6. `email.delivered`, `email.opened`, `email.delivery_delayed` → `null` each.

Keeping this as a pure function means the webhook branch itself stays a three-line dispatch that needs no integration test.

### Done when

- Typecheck, tests, and build green.
- End-to-end verification against Resend sandbox with `EMAIL_MODE="production"`:
  - Send to `bounced@resend.dev` → webhook fires → row appears in `email_suppressions` with `reason = "hard_bounce"`.
  - Send to `complained@resend.dev` → row appears with `reason = "complaint"`.
  - Send again to `bounced@resend.dev` → blocked before reaching Resend; `EmailLog` shows `status: "suppressed"`.
- Confirm `email_suppressions` contains **no** row for the configured support address.

---

## Phase 4 — Fix the `List-Unsubscribe` headers

### Goal

Stop advertising a one-click unsubscribe capability we do not implement.

### Files

- `src/lib/email.ts` (edit)
- `src/lib/__tests__/emailCategories.test.ts` (extend)

### Change

In the `deliverabilityHeaders` object in `sendEmail()`, **delete** these two lines:

```ts
"List-Unsubscribe": `<mailto:${replyToAddress}?subject=unsubscribe>`,
"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
```

Keep `X-Auto-Response-Suppress` and the `...extraHeaders` spread.

**Leave `Precedence: "transactional"` as-is.** `transactional` is not a registered value (the defined ones are `bulk`, `list`, `junk`), but it is inert and `bulk` would be actively wrong for this mail. Out of scope.

Add a one-line comment above the header object explaining that `List-Unsubscribe` is intentionally absent because all mail here is transactional, so the next person does not "helpfully" add it back.

If notification-class email is ever introduced, `List-Unsubscribe` returns as an **HTTPS** endpoint with a signed token, applied to `notification` category only. That is a future phase, not this one.

### Tests

1. Assert the headers passed to the Resend send mock contain **neither** `List-Unsubscribe` nor `List-Unsubscribe-Post`.
2. Assert `extraHeaders` passed via `options.headers` still reach the provider.

### Done when

- Typecheck, tests, build green.
- A real send inspected in the Resend dashboard shows no `List-Unsubscribe` header.

---

## Phase 5 — Admin visibility and reinstatement

### Goal

Give operators a way to see suppressions and remove one when a user fixes their mailbox. Without this, a suppression is permanent and invisible, which is worse than the original problem.

### Files

- `src/app/api/admin/email-suppressions/route.ts` (new — `GET`, `POST`)
- `src/app/api/admin/email-suppressions/[email]/route.ts` (new — `DELETE`)
- Admin UI surface alongside the existing inbound-email admin view (new)

### Requirements

- All routes admin-only. Match the existing authorization pattern in `src/app/api/admin/` — do not invent a new one.
- `GET` — paginated list, newest first, filterable by `reason`. Returns `{ data: [...] }`.
- `POST` — manual suppression. Body validated with Zod: `{ email: z.string().email(), detail: z.string().max(500).optional() }`. Writes `reason: "manual"`, `source: <admin user id>`. Must reject protected addresses with a 400.
- `DELETE` — reinstate. Write a `SecurityLog` entry recording which admin removed which suppression.
- UI uses semantic tokens only (`text-destructive`, `bg-muted`, etc.) per the style guide. No hardcoded Tailwind colors.

### Tests

1. Non-admin `GET` → 401/403.
2. `POST` with a malformed email → 400.
3. `POST` targeting the configured support address → 400 with a clear message.
4. `DELETE` removes the row and writes a `SecurityLog` entry.
5. `GET` filters correctly by `reason`.

### Done when

- Typecheck, tests, build green.
- Manual pass: suppress an address via the UI → confirm `sendEmail` to it returns `false` → remove it → confirm sending works again.

---

## 6. Explicitly out of scope

These are real and tracked, but they are **not** part of this plan. Do not bundle them in.

| Item                                                                                             | Why deferred                                                      |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Webhook returns 200 before processing                                                            | Separate concern; changes the whole handler's control flow        |
| Replace `errorMessage` LIKE-scan dedupe with real `providerMessageId` / `webhookEventId` columns | Schema + migration of its own; would obscure the suppression diff |
| HTTPS one-click unsubscribe endpoint                                                             | Not required — no bulk mail exists                                |
| Preference center / consent records                                                              | No marketing mail to consent to                                   |
| DMARC `p=none` → `p=quarantine`, root SPF cleanup                                                | Owner has a two-week freeze on DNS changes                        |
| Rotating `EMAIL_API_KEY` / `RESEND_WEBHOOK_SECRET`                                               | Operator task, not code                                           |
| Deleting the two stale Resend domains                                                            | Dashboard task, not code                                          |

---

## 7. Phase summary

| Phase | Deliverable                               | Behavior change          | Risk                                            |
| ----- | ----------------------------------------- | ------------------------ | ----------------------------------------------- |
| 1     | Schema + pure suppression logic           | none                     | none                                            |
| 2     | Enforcement in `sendEmail()` + categories | sends can now be blocked | **highest** — verify the security-class mapping |
| 3     | Webhook populates suppressions            | list fills automatically | medium                                          |
| 4     | Remove `List-Unsubscribe`                 | header removed           | low                                             |
| 5     | Admin visibility + reinstatement          | operators can intervene  | low                                             |

Phase 2 is the one to slow down on. A mistake there means a user cannot reset their password. The source-level guard test in Phase 2 exists specifically to make that failure mode loud.
