import { describe, expect, it } from "vitest";
import { createOAuthCallbackURL } from "./oauth-callback-url";

describe("createOAuthCallbackURL", () => {
  it("preserves state and safely encodes callback parameters", () => {
    const url = new URL(
      createOAuthCallbackURL("code&value", "state?value=1&x"),
    );

    expect(url.protocol).toBe("fotolokashen:");
    expect(url.hostname).toBe("oauth-callback");
    expect(url.searchParams.get("code")).toBe("code&value");
    expect(url.searchParams.get("state")).toBe("state?value=1&x");
  });

  it("omits state for legacy OAuth clients", () => {
    const url = new URL(createOAuthCallbackURL("legacy-code"));

    expect(url.searchParams.get("code")).toBe("legacy-code");
    expect(url.searchParams.has("state")).toBe(false);
  });
});
