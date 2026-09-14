import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ── Module mocks ──────────────────────────────────────────────────────────────

// Isolate this suite from real env validation / ambient .env state.
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "https://example.com",
    EMAIL_MODE: "production",
    EMAIL_API_KEY: "test-key",
    EMAIL_FROM_NAME: "Test Sender",
    EMAIL_FROM_ADDRESS: "hello@example.com",
    EMAIL_REPLY_TO: "support@example.com",
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailSuppression: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    emailLog: { create: vi.fn() },
  },
}));

vi.mock("resend", () => {
  const send = vi.fn();
  return {
    Resend: vi.fn().mockImplementation(function (this: unknown) {
      return { emails: { send } };
    }),
  };
});

// ── Imports after mocks ───────────────────────────────────────────────────────

import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const emailSuppressionFindUnique = vi.mocked(prisma.emailSuppression.findUnique);
const userFindUnique = vi.mocked(prisma.user.findUnique);
const emailLogCreate = vi.mocked(prisma.emailLog.create);
// The mocked Resend constructor always returns the same `emails.send` mock instance.
const resendSend = vi.mocked(new Resend("test-key").emails.send);

beforeEach(() => {
  vi.clearAllMocks();
  emailSuppressionFindUnique.mockResolvedValue(null as never);
  userFindUnique.mockResolvedValue(null as never);
  emailLogCreate.mockResolvedValue({} as never);
  resendSend.mockResolvedValue({ data: { id: "test-message-id" }, error: null } as never);
});

describe("sendEmail — suppression enforcement", () => {
  it("blocks a security email when the address has a hard bounce", async () => {
    emailSuppressionFindUnique.mockResolvedValue({ reason: "hard_bounce" } as never);

    const result = await sendEmail("dead@example.com", "Subject", "<p>hi</p>", {
      category: "security",
    });

    expect(result).toBe(false);
    expect(resendSend).not.toHaveBeenCalled();
    expect(emailLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "suppressed",
          errorMessage: expect.stringContaining("reason=hard_bounce"),
        }),
      }),
    );
  });

  it("does not block a security email on a complaint", async () => {
    emailSuppressionFindUnique.mockResolvedValue({ reason: "complaint" } as never);

    const result = await sendEmail("complainer@example.com", "Subject", "<p>hi</p>", {
      category: "security",
    });

    expect(result).toBe(true);
    expect(resendSend).toHaveBeenCalledTimes(1);
  });

  it("blocks a transactional email on a complaint", async () => {
    emailSuppressionFindUnique.mockResolvedValue({ reason: "complaint" } as never);

    const result = await sendEmail("complainer@example.com", "Subject", "<p>hi</p>", {
      category: "transactional",
    });

    expect(result).toBe(false);
    expect(resendSend).not.toHaveBeenCalled();
  });

  it("blocks notification mail when the user disabled email notifications", async () => {
    userFindUnique.mockResolvedValue({ emailNotifications: false } as never);

    const result = await sendEmail("user@example.com", "Subject", "<p>hi</p>", {
      category: "notification",
    });

    expect(result).toBe(false);
    expect(resendSend).not.toHaveBeenCalled();
    expect(emailLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "suppressed",
          errorMessage: expect.stringContaining("reason=user_preference"),
        }),
      }),
    );
  });

  it("does not block transactional mail when the user disabled email notifications", async () => {
    userFindUnique.mockResolvedValue({ emailNotifications: false } as never);

    const result = await sendEmail("user@example.com", "Subject", "<p>hi</p>", {
      category: "transactional",
    });

    expect(result).toBe(true);
    expect(resendSend).toHaveBeenCalledTimes(1);
  });

  it("does not block security mail when the user disabled email notifications", async () => {
    userFindUnique.mockResolvedValue({ emailNotifications: false } as never);

    const result = await sendEmail("user@example.com", "Subject", "<p>hi</p>", {
      category: "security",
    });

    expect(result).toBe(true);
    expect(resendSend).toHaveBeenCalledTimes(1);
  });

  it("does not look up the user for non-notification categories", async () => {
    await sendEmail("user@example.com", "Subject", "<p>hi</p>", {
      category: "security",
    });

    expect(userFindUnique).not.toHaveBeenCalled();
  });
});

describe("sendEmail — source-level guard on security wrappers", () => {
  const SECURITY_WRAPPERS = [
    "sendVerificationEmail",
    "sendPasswordResetEmail",
    "sendPasswordChangedEmail",
    "sendAccountDeletionEmail",
    "sendEmailChangeVerification",
    "sendEmailChangeAlert",
    "sendEmailChangeConfirmation",
  ];

  const source = readFileSync(
    join(process.cwd(), "src/lib/email.ts"),
    "utf-8",
  );

  it.each(SECURITY_WRAPPERS)(
    '%s passes category: "security" to sendEmail()',
    (name) => {
      const start = source.indexOf(`export async function ${name}`);
      expect(start, `${name} not found in src/lib/email.ts`).toBeGreaterThan(-1);

      const nextFnStart = source.indexOf("\nexport async function", start + 1);
      const body = nextFnStart === -1 ? source.slice(start) : source.slice(start, nextFnStart);

      expect(body).toMatch(/category:\s*"security"/);
    },
  );
});
