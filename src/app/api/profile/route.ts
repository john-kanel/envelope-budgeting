import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { profileSchema } from "@/lib/validators";
import { dollarsToCents } from "@/lib/money";
import { parseJsonBody } from "@/lib/request";

export async function GET() {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      startingBalanceCents: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email,
      startingBalance: user.startingBalanceCents / 100,
    },
  });
}

export async function PATCH(request: Request) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, profileSchema);
  if (!parsed.ok) return parsed.response;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      startingBalanceCents: dollarsToCents(parsed.data.startingBalance),
    },
    select: {
      id: true,
      email: true,
      startingBalanceCents: true,
    },
  });

  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email,
      startingBalance: user.startingBalanceCents / 100,
    },
  });
}
