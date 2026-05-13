type ResponseCookieOpts = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
};

export const COOKIE_ACCESS = "access_token";
export const COOKIE_REFRESH = "refresh_token";

/** Khớp TTL JWT access mặc định backend (~15m). */
const ACCESS_MAX_AGE_SEC = 15 * 60;
/** Khớp refresh TTL Redis mặc định (7d). */
const REFRESH_MAX_AGE_SEC = 60 * 60 * 24 * 7;

const isProd = process.env.NODE_ENV === "production";

function base(): Omit<ResponseCookieOpts, "maxAge"> {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };
}

export function accessCookieOptions(): ResponseCookieOpts {
  return { ...base(), maxAge: ACCESS_MAX_AGE_SEC };
}

export function refreshCookieOptions(): ResponseCookieOpts {
  return { ...base(), maxAge: REFRESH_MAX_AGE_SEC };
}

export function clearCookieOptions(): ResponseCookieOpts {
  return { ...base(), maxAge: 0 };
}
