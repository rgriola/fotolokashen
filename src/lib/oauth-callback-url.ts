export function createOAuthCallbackURL(
  code: string,
  state?: string | null,
): string {
  const callbackUrl = new URL("fotolokashen://oauth-callback");
  callbackUrl.searchParams.set("code", code);
  if (state !== undefined && state !== null) {
    callbackUrl.searchParams.set("state", state);
  }
  return callbackUrl.toString();
}
