import { describe, expect, it } from "vitest";
import { buildOAuthCallbackUrl } from "../oauthCallback";

describe("OAuth callback state passthrough", () => {
  it.each(["random-state_123", "a+b/c?d=e&f#% space", ""])(
    "preserves state %j through HTTPS and custom-scheme redirects",
    (state) => {
      const code = "code+with&reserved=characters";
      const httpsCallback = new URL(
        buildOAuthCallbackUrl(
          "https://fotolokashen.com/app/auth-callback",
          code,
          state,
        ),
      );
      const appCallback = new URL(
        buildOAuthCallbackUrl(
          "fotolokashen://oauth-callback",
          httpsCallback.searchParams.get("code")!,
          httpsCallback.searchParams.get("state"),
        ),
      );

      expect(appCallback.searchParams.getAll("state")).toEqual([state]);
      expect(appCallback.searchParams.get("code")).toBe(code);
    },
  );

  it.each([undefined, null])(
    "omits absent state %j for older clients",
    (state) => {
      const url = new URL(
        buildOAuthCallbackUrl("fotolokashen://oauth-callback", "code", state),
      );
      expect(url.searchParams.has("state")).toBe(false);
      expect(url.searchParams.get("code")).toBe("code");
    },
  );
});
