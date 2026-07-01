import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { goalSchema } from "@/lib/validators";
import { dollarsToCents } from "@/lib/money";
import { parseJsonBody } from "@/lib/request";
import { serializeGoal } from "@/lib/goals";

type Params = Promise<{ id: string }>;

export async function PATCH(
  request: Request,
  { params }: { params: Params },
) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.goal.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, goalSchema);
  if (!parsed.ok) return parsed.response;

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      name: parsed.data.name,
      type: parsed.data.type ?? existing.type,
      targetAmountCents: dollarsToCents(parsed.data.targetAmount),
      savedAmountCents: dollarsToCents(parsed.data.savedAmount ?? existing.savedAmountCents / 100),
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
      note: parsed.data.note || null,
      isActive: parsed.data.isActive ?? existing.isActive,
    },
  });

  return NextResponse.json({ goal: serializeGoal(goal) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.goal.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
