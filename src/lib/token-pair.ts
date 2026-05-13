export type TokenPair = {
  access_token: string;
  refresh_token: string;
};

/** Chuẩn hoá JSON từ Nest: snake_case, camelCase, hoặc bọc { data }. */
export function extractTokenPair(data: unknown): TokenPair | null {
  if (!data || typeof data !== "object") return null;
  let o = data as Record<string, unknown>;
  if (o.data !== undefined && typeof o.data === "object" && o.data !== null) {
    o = o.data as Record<string, unknown>;
  }
  const at = o.access_token ?? o.accessToken;
  const rt = o.refresh_token ?? o.refreshToken;
  if (typeof at === "string" && typeof rt === "string" && at.length > 0 && rt.length > 0) {
    return { access_token: at, refresh_token: rt };
  }
  return null;
}
