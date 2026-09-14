import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  isBlocked,
  classifyBounce,
  isProtectedAddress,
} from "@/lib/email-suppression";

describe("normalizeEmail", () => {
  it("trims whitespace and lowercases", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
});

describe("isBlocked", () => {
  // hard_bounce blocks every category
  it("hard_bounce blocks security", () => {
    expect(isBlocked("security", "hard_bounce")).toBe(true);
  });
  it("hard_bounce blocks transactional", () => {
    expect(isBlocked("transactional", "hard_bounce")).toBe(true);
  });
  it("hard_bounce blocks notification", () => {
    expect(isBlocked("notification", "hard_bounce")).toBe(true);
  });

  // complaint blocks transactional + notification, not security
  it("complaint does not block security", () => {
    expect(isBlocked("security", "complaint")).toBe(false);
  });
  it("complaint blocks transactional", () => {
    expect(isBlocked("transactional", "complaint")).toBe(true);
  });
  it("complaint blocks notification", () => {
    expect(isBlocked("notification", "complaint")).toBe(true);
  });

  // provider_suppressed blocks transactional + notification, not security
  it("provider_suppressed does not block security", () => {
    expect(isBlocked("security", "provider_suppressed")).toBe(false);
  });
  it("provider_suppressed blocks transactional", () => {
    expect(isBlocked("transactional", "provider_suppressed")).toBe(true);
  });
  it("provider_suppressed blocks notification", () => {
    expect(isBlocked("notification", "provider_suppressed")).toBe(true);
  });

  // manual blocks every category
  it("manual blocks security", () => {
    expect(isBlocked("security", "manual")).toBe(true);
  });
  it("manual blocks transactional", () => {
    expect(isBlocked("transactional", "manual")).toBe(true);
  });
  it("manual blocks notification", () => {
    expect(isBlocked("notification", "manual")).toBe(true);
  });
});

describe("classifyBounce", () => {
  it('returns "hard_bounce" for type "Permanent"', () => {
    expect(classifyBounce({ type: "Permanent" })).toBe("hard_bounce");
  });
  it('returns "hard_bounce" for type "permanent" (case-insensitive)', () => {
    expect(classifyBounce({ type: "permanent" })).toBe("hard_bounce");
  });
  it('returns null for type "Transient"', () => {
    expect(classifyBounce({ type: "Transient" })).toBeNull();
  });
  it('returns null for type "Undetermined"', () => {
    expect(classifyBounce({ type: "Undetermined" })).toBeNull();
  });
  it("returns null for an empty object", () => {
    expect(classifyBounce({})).toBeNull();
  });
  it("returns null when type is undefined", () => {
    expect(classifyBounce({ type: undefined })).toBeNull();
  });
});

describe("isProtectedAddress", () => {
  it("returns true for the configured reply-to address in mixed case", () => {
    const replyTo = process.env.EMAIL_REPLY_TO;
    if (!replyTo) {
      throw new Error(
        "EMAIL_REPLY_TO must be set for this test to be meaningful",
      );
    }
    expect(isProtectedAddress(replyTo.toUpperCase())).toBe(true);
  });

  it("returns false for an unrelated address", () => {
    expect(isProtectedAddress("someone-unrelated@example.com")).toBe(false);
  });
});
