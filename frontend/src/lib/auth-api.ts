import { ADMIN_ROLE_NAME } from "./auth-constants";

export type AuthUser = {
  id: string;
  email: string;
  tenant_id: string | null;
  roles: string[];
};

const cred: RequestInit = { credentials: "include" };

function nestMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "Đã xảy ra lỗi";
  const msg = (body as { message?: unknown }).message;
  if (Array.isArray(msg) && msg[0] && typeof msg[0] === "string") return msg[0];
  if (typeof msg === "string") return msg;
  return "Đã xảy ra lỗi";
}

/** Đăng nhập qua BFF; token nằm trong cookie HttpOnly, body trả { user }. */
export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    ...cred,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(nestMessage(body));
  const user = (body as { user?: AuthUser }).user;
  if (!user || typeof user.email !== "string") {
    throw new Error("Server không trả đủ thông tin user");
  }
  return user;
}

/** Đăng ký qua BFF; cookie HttpOnly + { user }. */
export async function registerRequest(payload: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}): Promise<AuthUser> {
  const res = await fetch("/api/auth/register", {
    ...cred,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(nestMessage(body));
  const user = (body as { user?: AuthUser }).user;
  if (!user || typeof user.email !== "string") {
    throw new Error("Server không trả đủ thông tin user");
  }
  return user;
}

export async function fetchAuthMe(): Promise<AuthUser> {
  const res = await fetch("/api/auth/me", cred);
  if (!res.ok) throw new Error("Phiên không hợp lệ");
  return res.json() as Promise<AuthUser>;
}

export async function logoutRequest(): Promise<void> {
  await fetch("/api/auth/logout", { ...cred, method: "POST" });
}

export function userHasAdminRole(user: AuthUser | null): boolean {
  return !!user?.roles?.includes(ADMIN_ROLE_NAME);
}
