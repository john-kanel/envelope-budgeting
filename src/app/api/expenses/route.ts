import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { expenseSchema, monthKeySchema } from "@/lib/validators";
import { dollarsToCents } from "@/lib/money";
import { monthRange } from "@/lib/month";
import { parseJsonBody } from "@/lib/request";

export async function GET(request: Request) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthKey = searchParams.get("month");
  const categoryId = searchParams.get("categoryId");
  const taxOnly = searchParams.get("taxOnly") === "true";

  const where: {
    userId: string;
    categoryId?: string;
    isTaxDeductible?: boolean;
    spentOn?: { gte: Date; lt: Date };
  } = { userId };

  if (monthKey) {
    const monthParsed = monthKeySchema.safeParse(monthKey);
    if (!monthParsed.success) {
      return NextResponse.json({ error: "Invalid month format." }, { status: 400 });
    }
    const { start, end } = monthRange(monthKey);
    where.spentOn = { gte: start, lt: end };
  }
  if (categoryId) where.categoryId = categoryId;
  if (taxOnly) where.isTaxDeductible = true;

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: [{ spentOn: "desc" }, { createdAt: "desc" }],
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    expenses: expenses.map((item) => ({
      ...item,
      amount: item.amountCents / 100,
    })),
  });
}

export async function POST(request: Request) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const expense = await prisma.expense.create({
    data: {
      userId,
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

  return NextResponse.json(
    {
      expense: {
        ...expense,
        amount: expense.amountCents / 100,
      },
    },
    { status: 201 },
  );
}
