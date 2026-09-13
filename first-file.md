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
