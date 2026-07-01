import { NextResponse } from "next/server";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authSchema } from "@/lib/validators";
import { getClientKey, checkRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/request";

export async function POST(request: Request) {
  const clientKey = getClientKey(request);
  const rate = checkRateLimit(`signin:${clientKey}`, { windowMs: 60_000, max: 10 });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  const parsed = await parseJsonBody(request, authSchema);
  if (!parsed.ok) return parsed.response;

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await createSessionToken({ sub: user.id, email: user.email });
  await setSessionCookie(token);

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
