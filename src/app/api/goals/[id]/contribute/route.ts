import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { goalContributionSchema } from "@/lib/validators";
import { dollarsToCents } from "@/lib/money";
import { parseJsonBody } from "@/lib/request";
import { serializeGoal } from "@/lib/goals";

type Params = Promise<{ id: string }>;

export async function POST(
  request: Request,
  { params }: { params: Params },
) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.goal.findFirst({
    where: { id, userId, isActive: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, goalContributionSchema);
  if (!parsed.ok) return parsed.response;

  const addedCents = dollarsToCents(parsed.data.amount);
  const goal = await prisma.goal.update({
    where: { id },
    data: {
      savedAmountCents: existing.savedAmountCents + addedCents,
    },
  });

  return NextResponse.json({ goal: serializeGoal(goal) });
}
