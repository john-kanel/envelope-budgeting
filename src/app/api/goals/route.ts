import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { goalSchema } from "@/lib/validators";
import { dollarsToCents } from "@/lib/money";
import { parseJsonBody } from "@/lib/request";
import { serializeGoal } from "@/lib/goals";

export async function GET(request: Request) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("activeOnly") !== "false";

  const goals = await prisma.goal.findMany({
    where: {
      userId,
      ...(activeOnly ? { isActive: true } : {}),
    },
    orderBy: [{ isActive: "desc" }, { targetDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    goals: goals.map(serializeGoal),
  });
}

export async function POST(request: Request) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, goalSchema);
  if (!parsed.ok) return parsed.response;

  const goal = await prisma.goal.create({
    data: {
      userId,
      name: parsed.data.name,
      type: parsed.data.type ?? "other",
      targetAmountCents: dollarsToCents(parsed.data.targetAmount),
      savedAmountCents: dollarsToCents(parsed.data.savedAmount ?? 0),
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
      note: parsed.data.note || null,
      isActive: parsed.data.isActive ?? true,
    },
  });

  return NextResponse.json({ goal: serializeGoal(goal) }, { status: 201 });
}
