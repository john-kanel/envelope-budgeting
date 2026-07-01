import { NextResponse } from "next/server";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authSchema } from "@/lib/validators";
import { getClientKey, checkRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/request";

export async function POST(request: Request) {
  const clientKey = getClientKey(request);
  const rate = checkRateLimit(`signup:${clientKey}`, { windowMs: 60_000, max: 5 });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  const parsed = await parseJsonBody(request, authSchema);
  if (!parsed.ok) return parsed.response;

  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        categories: {
          create: [
            { name: "Housing" },
            { name: "Transportation" },
            { name: "Food" },
            { name: "Utilities" },
            { name: "Personal" },
          ],
        },
      },
      select: { id: true, email: true },
    });
    return created;
  });

  const token = await createSessionToken({ sub: user.id, email: user.email });
  await setSessionCookie(token);

  return NextResponse.json({ user });
}
