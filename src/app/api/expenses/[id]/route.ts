import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { expenseSchema } from "@/lib/validators";
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
  const existing = await prisma.expense.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, expenseSchema);
  if (!parsed.ok) return parsed.response;

  const category = await prisma.category.findFirst({
    where: {
      id: parsed.data.categoryId,
      userId,
      isActive: true,
    },
  });
  if (!category) {
    return NextResponse.json(
      { error: "Category not found or inactive." },
      { status: 404 },
    );
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      categoryId: parsed.data.categoryId,
      amountCents: dollarsToCents(parsed.data.amount),
      spentOn: new Date(parsed.data.spentOn),
      note: parsed.data.note || null,
      isTaxDeductible: parsed.data.isTaxDeductible ?? false,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    expense: {
      ...expense,
      amount: expense.amountCents / 100,
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
  const existing = await prisma.expense.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
