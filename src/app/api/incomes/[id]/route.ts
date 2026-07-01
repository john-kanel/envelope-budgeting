import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { incomeSchema } from "@/lib/validators";
import { dollarsToCents } from "@/lib/money";
import { parseJsonBody } from "@/lib/request";

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
  const existing = await prisma.income.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Income entry not found." }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, incomeSchema);
  if (!parsed.ok) return parsed.response;

  const income = await prisma.income.update({
    where: { id },
    data: {
      amountCents: dollarsToCents(parsed.data.amount),
      receivedOn: new Date(parsed.data.receivedOn),
      source: parsed.data.source || null,
      note: parsed.data.note || null,
    },
  });

  return NextResponse.json({
    income: {
      ...income,
      amount: income.amountCents / 100,
    },
  });
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
  const existing = await prisma.income.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Income entry not found." }, { status: 404 });
  }

  await prisma.income.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
