import { readSessionCookie, verifySessionToken } from "@/lib/auth";

export async function getSessionUserId() {
  const token = await readSessionCookie();
  if (!token) return null;
  try {
    const payload = await verifySessionToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}

export async function requireSessionUserId() {
  const userId = await getSessionUserId();
  return userId;
}
