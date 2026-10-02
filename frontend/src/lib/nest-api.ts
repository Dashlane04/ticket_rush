/** Same-origin prefix proxied to Nest (`BACKEND_URL`) via `next.config` rewrites. */
export function nestApiUrl(path: string): string {
  const trimmed = path.replace(/^\/+/, "");
  return `/api/nest/${trimmed}`;
}

export async function nestFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof URLSearchParams) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(nestApiUrl(path), { ...init, headers, credentials: "include" });
}
