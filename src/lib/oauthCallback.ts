export function buildOAuthCallbackUrl(
  destination: string,
  code: string,
  state?: string | null,
): string {
  const url = new URL(destination);
  url.searchParams.set("code", code);
  if (state !== undefined && state !== null) {
    url.searchParams.set("state", state);
  }
  return url.toString();
}
