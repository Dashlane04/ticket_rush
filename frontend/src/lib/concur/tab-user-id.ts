/** Cùng key với flow đặt vé — vé gắn theo phiên tab. */
export const TR_USER_KEY = "TR_USER_ID";

export function getOrCreateTabUserId(): string {
  if (typeof window === "undefined") return "USER-SERVER";
  let id = sessionStorage.getItem(TR_USER_KEY);
  if (!id) {
    id = "USER-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    sessionStorage.setItem(TR_USER_KEY, id);
  }
  return id;
}
