import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { budgetSchema, monthKeySchema } from "@/lib/validators";
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
  if (!monthKey) {
    return NextResponse.json(
      { error: "month query parameter is required." },
      { status: 400 },
    );
  }
  const monthParsed = monthKeySchema.safeParse(monthKey);
  if (!monthParsed.success) {
    return NextResponse.json({ error: "Invalid month format." }, { status: 400 });
  }

  const budgets = await prisma.monthlyBudget.findMany({
    where: { userId, monthKey },
    include: {
      category: { select: { id: true, name: true, isActive: true } },
    },
    orderBy: { category: { name: "asc" } },
  });

  const { start, end } = monthRange(monthKey);
  const expenseRows = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      spentOn: { gte: start, lt: end },
    },
    _sum: { amountCents: true },
  });

  const actualByCategory = new Map(
    expenseRows.map((row) => [row.categoryId, row._sum.amountCents ?? 0]),
  );

  const rows = budgets.map((budget) => {
    const actualCents = actualByCategory.get(budget.categoryId) ?? 0;
    return {
      id: budget.id,
      monthKey: budget.monthKey,
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      budget: budget.budgetCents / 100,
      actual: actualCents / 100,
      difference: (budget.budgetCents - actualCents) / 100,
    };
  });

  return NextResponse.json({ budgets: rows });
}

export async function POST(request: Request) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, budgetSchema);
  if (!parsed.ok) return parsed.response;

  const category = await prisma.category.findFirst({
    where: {
      id: parsed.data.categoryId,
      userId,
    },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const budget = await prisma.monthlyBudget.upsert({
    where: {
      userId_categoryId_monthKey: {
        userId,
        categoryId: parsed.data.categoryId,
        monthKey: parsed.data.monthKey,
      },
    },
    create: {
      userId,
      categoryId: parsed.data.categoryId,
      monthKey: parsed.data.monthKey,
      budgetCents: dollarsToCents(parsed.data.budget),
    },
    update: {
      budgetCents: dollarsToCents(parsed.data.budget),
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    budget: {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      monthKey: budget.monthKey,
      budget: budget.budgetCents / 100,
    },
  });
}
