/**
 * User Management (auth / profiles) — port 8001 locally.
 * Browser calls use the `/user-api` Next.js rewrite (see next.config.ts).
 */
export function getAuthApiBase(): string {
  if (typeof window !== "undefined") {
    return "/user-api";
  }
  return (
    process.env.NEXT_PUBLIC_AUTH_API_BASE?.replace(/\/$/, "") ??
    process.env.USER_API_PROXY_TARGET?.replace(/\/$/, "") ??
    "http://127.0.0.1:8001"
  );
}
