import { prisma } from "./prisma";
import { env } from "./env";
import type { EmailSuppression } from "@prisma/client";

export type EmailCategory = "security" | "transactional" | "notification";

export type SuppressionReason =
  | "hard_bounce"
  | "complaint"
  | "provider_suppressed"
  | "manual";

// Higher index = stricter. Used to decide whether a new suppression event
// should upgrade an existing row's reason.
const REASON_STRICTNESS: SuppressionReason[] = [
  "provider_suppressed",
  "complaint",
  "manual",
  "hard_bounce",
];

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isProtectedAddress(email: string): boolean {
  const normalized = normalizeEmail(email);
  const protectedAddresses = [env.EMAIL_REPLY_TO, process.env.SUPPORT_EMAIL]
    .filter((address): address is string => Boolean(address))
    .map(normalizeEmail);

  return protectedAddresses.includes(normalized);
}

// Implements the enforcement matrix — see docs/planning/EMAIL_SUPPRESSION_IMPLEMENTATION_PLAN_2026-09-13.md §1.2
export function isBlocked(
  category: EmailCategory,
  reason: SuppressionReason,
): boolean {
  if (reason === "hard_bounce") return true;
  if (reason === "manual") return true;
  // complaint / provider_suppressed: blocked for transactional + notification, allowed for security
  return category !== "security";
}

export function classifyBounce(bounce: {
  type?: string;
  subType?: string;
}): SuppressionReason | null {
  if (bounce.type?.toLowerCase() === "permanent") return "hard_bounce";
  return null;
}

export async function getSuppression(
  email: string,
): Promise<EmailSuppression | null> {
  return prisma.emailSuppression.findUnique({
    where: { email: normalizeEmail(email) },
  });
}

export async function suppressEmail(input: {
  email: string;
  reason: SuppressionReason;
  detail?: string;
  source?: string;
}): Promise<void> {
  const normalized = normalizeEmail(input.email);

  if (isProtectedAddress(normalized)) {
    console.warn(
      `[EmailSuppression] Refusing to suppress protected address "${normalized}" (reason=${input.reason})`,
    );
    return;
  }

  const existing = await prisma.emailSuppression.findUnique({
    where: { email: normalized },
  });

  if (
    existing &&
    REASON_STRICTNESS.indexOf(existing.reason as SuppressionReason) >=
      REASON_STRICTNESS.indexOf(input.reason)
  ) {
    // Existing reason is already as strict or stricter — leave it alone.
    return;
  }

  await prisma.emailSuppression.upsert({
    where: { email: normalized },
    create: {
      email: normalized,
      reason: input.reason,
      detail: input.detail,
      source: input.source,
    },
    update: {
      reason: input.reason,
      detail: input.detail,
      source: input.source,
    },
  });
}

export async function unsuppressEmail(email: string): Promise<void> {
  await prisma.emailSuppression.deleteMany({
    where: { email: normalizeEmail(email) },
  });
}
