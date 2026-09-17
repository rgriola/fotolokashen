# This is my thoughts and notepad for creating prompts. You may read it to understand my tbinking. This file is not-canonicle, rather it helps me work out our process

July 26, 2026

**_ Issue _**
The custom email UI is hindering development of our core features. We want to switch to transactional emails for the auth system ie handled by the database. With the email texts (subject and body ) contained in one file as strings - email context resource file.

**_ Context _**
Custom emails are an Admin only feature.
Since it has been months our last update to this project a review of our project health should be conducted.

**_ Task _**
Evaluate the steps needed to remove the custom email UI and switch to transactional emails. The transactional emails will need a config file containing the - strings with email subject + body.

Consider how this affects the iOS app, though the iOS does not have admin features.

Other issues to consider;

- iOS and Web share the database
- Migration away from imageKit to a photo storage system, we are currently in a test feature mode with them. We would need to fully validate and sanitize images + accept short videos (future). What would this cost in terms of time, and what storage vendors could we use. How would this implementation look.

**_ Goal _**
Start to simplify both web + iOS app implementations.
Final assesment should be placed into a markdown file with clear phases tests for changes an agent can execute.
Include unit tests.

Migration Update;

Stick with ImageKit hold off on vendor migration;

Lets work on your recomendations;
First create a storage abstraction github branch then implement your plan to update it. Once it is tested and merged we will work on the virus-scan gap, the after the email.

The storage adapter abstraction then fix the virus-scan gap. We will tackle the Email plan after the above is cleanly implemented.
Email;

July 27

Resend provides two endpoints for sending emails:

| Approach   | Endpoint             | Use Case                                                                  |
| ---------- | -------------------- | ------------------------------------------------------------------------- |
| **Single** | `POST /emails`       | Individual transactional emails, emails with attachments, scheduled sends |
| **Batch**  | `POST /emails/batch` | Multiple distinct emails in one request (max 100), bulk notifications     |

**Choose batch when:**

- Sending 2+ distinct emails at once
- Reducing API calls is important (by default, rate limit is 10 requests per second)
- No attachments or scheduling needed

**Choose single when:**

- Sending one email
- Email needs attachments
- Email needs to be scheduled
- Different recipients need different timing

## Quick Start

1. **Detect project language** from config files (package.json, requirements.txt, go.mod, etc.)
2. **Install SDK** (preferred) or use cURL
3. **Choose single or batch** based on the decision matrix above
4. **Implement best practices** - Idempotency keys, error handling, retries

## Best Practices (Critical for Production)

Always implement these for production email sending.

### Idempotency Keys

Prevent duplicate emails when retrying failed requests.

| Key Facts             |                                                                  |
| --------------------- | ---------------------------------------------------------------- |
| **Format (single)**   | `<event-type>/<entity-id>` (e.g., `welcome-email/user-123`)      |
| **Format (batch)**    | `batch-<event-type>/<batch-id>` (e.g., `batch-orders/batch-456`) |
| **Expiration**        | 24 hours                                                         |
| **Max length**        | 256 characters                                                   |
| **Duplicate payload** | Returns original response without resending                      |
| **Different payload** | Returns 409 error                                                |

### Error Handling

| Code     | Action                                                                                       |
| -------- | -------------------------------------------------------------------------------------------- |
| 400, 422 | Fix request parameters, don't retry                                                          |
| 401, 403 | Check API key / verify domain, don't retry                                                   |
| 409      | Idempotency conflict - use new key or fix payload                                            |
| 429      | Rate limited - retry with exponential backoff (by default, rate limit is 10 requests/second) |
| 500      | Server error - retry with exponential backoff                                                |

### Retry Strategy

- **Backoff:** Exponential (1s, 2s, 4s...)
- **Max retries:** 3-5 for most use cases
- **Only retry:** 429 (rate limit) and 500 (server error)
- **Always use:** Idempotency keys when retrying

## Single Email

**Endpoint:** `POST /emails` (prefer SDK over cURL)

### Required Parameters

| Parameter        | Type      | Description                                         |
| ---------------- | --------- | --------------------------------------------------- |
| `from`           | string    | Sender address. Format: `"Name <email@domain.com>"` |
| `to`             | string\[] | Recipient addresses (max 50)                        |
| `subject`        | string    | Email subject line                                  |
| `html` or `text` | string    | Email body content                                  |

### Optional Parameters

| Parameter        | Type      | Description                       |
| ---------------- | --------- | --------------------------------- |
| `cc`             | string\[] | CC recipients                     |
| `bcc`            | string\[] | BCC recipients                    |
| `reply_to`\*     | string\[] | Reply-to addresses                |
| `scheduled_at`\* | string    | Schedule send time (ISO 8601)     |
| `attachments`    | array     | File attachments (max 40MB total) |
| `tags`           | array     | Key/value pairs for tracking      |
| `headers`        | object    | Custom headers                    |

\*Parameter naming varies by SDK (e.g., `replyTo` in Node.js, `reply_to` in Python).

### Minimal Example (Node.js)

```typescript theme={"theme":{"light":"github-light","dark":"vesper"}}
import { Resend } from "resend";

const resend = new Resend("YOUR_RESEND_API_KEY");

const { data, error } = await resend.emails.send(
  {
    from: "Acme <onboarding@resend.dev>",
    to: ["delivered@resend.dev"],
    subject: "Hello World",
    html: "<p>Email body here</p>",
  },
  { idempotencyKey: `welcome-email/${userId}` },
);

if (error) {
  console.error("Failed:", error.message);
  return;
}
console.log("Sent:", data.id);
```

## Batch Email

**Endpoint:** `POST /emails/batch` (but prefer SDK over cURL)

### Limitations

- **No attachments** - Use single sends for emails with attachments
- **No scheduling** - Use single sends for scheduled emails
- **Atomic** - If one email fails validation, the entire batch fails
- **Max 100 emails** per request
- **Max 50 recipients** per individual email in the batch

### Pre-validation

Since the entire batch fails on any validation error, validate all emails before sending:

- Check required fields (from, to, subject, html/text)
- Validate email formats
- Ensure batch size is less than or equal to 100

### Minimal Example (Node.js)

```typescript theme={"theme":{"light":"github-light","dark":"vesper"}}
import { Resend } from "resend";

const resend = new Resend("YOUR_RESEND_API_KEY");

const { data, error } = await resend.batch.send(
  [
    {
      from: "Acme <hello@example.com>",
      to: ["delivered@resend.dev"],
      subject: "Order Shipped",
      html: "<p>Your order has shipped!</p>",
    },
    {
      from: "Acme <hello@example.com>",
      to: ["delivered@resend.dev"],
      subject: "Order Confirmed",
      html: "<p>Your order is confirmed!</p>",
    },
  ],
  { idempotencyKey: `batch-orders/${batchId}` },
);

if (error) {
  console.error("Batch failed:", error.message);
  return;
}
console.log(
  "Sent:",
  data.map((e) => e.id),
);
```

> > > > TO DO Sept 13 >>>>
> > > > Other suggestions, all code-side

Suppression list.

You handle email.bounced and email.complained events but nothing stops the next send. One hard bounce to a dead address is fine; repeated sends to it is how domains get blocked.

Add a suppressedEmail table, write to it on hard bounce/complaint, and check it at the top of sendEmail(). Return 200 before processing.

The webhook currently does signature verification, a Resend API fetch, and several Prisma writes before responding. Resend retries on timeout, so a slow DB turns one email into duplicates. Verify the signature, respond, then process.

Replace the dedupe hack.

emailLog.findFirst({ where: { errorMessage: { contains: \webhookId=${id}` } } })is a full-tableLIKEscan on every event and can't be made atomic.

Add realproviderMessageIdandwebhookEventId` columns with a unique index.

Upgrade the SDK. You're on resend@6.6.0;
webhooks.verify() and emails.receiving.\* are only fully supported from 6.14.0.

Rotate EMAIL_API_KEY and RESEND_WEBHOOK_SECRET — both appeared in this chat.

Handle the unsubscribe mailbox.

Your List-Unsubscribe header points at mailto:support@fotolokashen.com?subject=unsubscribe. That now reaches a real inbox, but nothing acts on it. Either process it via the inbound webhook or switch the header to a URL endpoint.

Test with Resend's sandbox addresses — delivered@resend.dev, bounced@resend.dev, complained@resend.dev. Never test bounces against real Gmail addresses.

In two weeks, when you touch DNS again
Move both DMARC records from p=none to p=quarantine once the rua reports look clean, and drop include:amazonses.com from the root SPF since nothing sends from the root anymore.

> > > > >

Sept 17 2026

While a user on iOS was uploading a photo to create a location the vercel server kicked this error. The photo was uploaded and the location was created, the user did not see any issues.

Vercel Error Log
[Photo Upload] Scanning photo_1789670394.jpg for viruses...
🔍 Initializing ClamAV scanner...
❌ Failed to initialize ClamAV scanner: Error: connect ECONNREFUSED 127.0.0.1:3310
at <unknown> (Error: connect ECONNREFUSED 127.0.0.1:3310) {
errno: -111,
code: "ECONNREFUSED",
syscall: "connect",
address: "127.0.0.1",
port: 3310
}
⚠️ Virus scanning will be DISABLED for this session
To fix: Ensure ClamAV daemon is running on localhost : 3310
⚠️ [Virus Scan] ALLOWED photo_1789670394.jpg - Scanner unavailable (fail-open mode)
[Photo Upload] ✅ File clean: photo_1789670394.jpg
[Photo Upload] Uploading to ImageKit: /production/users/2/photos/photo-1789670394969-photo_1789670394.jpg
[Photo Upload] ✅ Upload successful: /production/users/2/photos/photo-1789670394969-photo_1789670394_7iu3QYpXj.jpg

> > >

People Search Issue::

On Web App > Searched "Rod" > 3 accounts were returned but this error was in the logs.

Username search error: Error [PrismaClientKnownRequestError]:
Invalid `prisma.$queryRaw()` invocation:

Raw query failed. Code: `42883`. Message: `ERROR: function similarity(character varying, text) does not exist
HINT: No function matches the given name and argument types. You might need to add explicit type casts.`
at async r (.next/server/chunks/[root-of-the-server]**916d91b1.\_.js:1:1564)
at async i (.next/server/chunks/[root-of-the-server]**916d91b1._.js:67:1491)
at async (.next/server/chunks/[root-of-the-server]\_\_916d91b1._.js:67:2128)
at async (.next/server/chunks/_6850a570._.js:1:75523) {
code: 'P2010',
meta: [Object],
clientVersion: '6.19.3'
}

> > > > > Another user issue:
> > > > > on iOS A user was trying to search for a user, the app logged them out. They also reported being logged out unexpectedly after about 5 mins. I had the same experience being unexpectedly logged out after a short period. This problem did not seem to happenm on the web app. Can you trace this issue. I do have logs if that will help.

> > >

Prisma Issue:

Ok lets update the Databaseb_Deployment_Guide & Build_Commands to be correct.

I did know about #1

#2 I believe Vercel only builds Main/Origin the default github branch.

Searched for a user on iOS, then the app logged me out again. the Server showed a 401 at the time. Also I logged out of both the web + iOS then trying to log back into iOS the app showed "Token Exchange Failed" error.

Sep 17 16:50:26.23
GET
200
fotolokashen.com
/register
Sep 17 16:50:26.23
GET
200
fotolokashen.com
/forgot-password
Sep 17 16:50:26.23
GET
401
fotolokashen.com
/api/auth/me
Sep 17 16:50:26.10
GET

---

fotolokashen.com
/logo.png
Sep 17 16:50:26.04
GET

---

fotolokashen.com
/images/landing/hero/login-hero-bg.jpg
Sep 17 16:50:25.86
GET
200
fotolokashen.com
/login
Sep 17 16:49:52.51
GET
401
fotolokashen.com
/api/v1/search/users
Sep 17 16:49:44.67
GET
200
fotolokashen.com
/api/v1/users/rgriola/followers
Sep 17 16:49:34.84
GET
200
fotolokashen.com
/api/locations/135
Sep 17 16:49:34.78
GET
200
fotolokashen.com
/api/locations/138/photos
