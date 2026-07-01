import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { monthRange } from "@/lib/month";
import { monthKeySchema } from "@/lib/validators";
import { computeBudgetDifference } from "@/lib/reporting";

export async function GET(request: Request) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthKey = searchParams.get("month");
  if (!monthKey) {
    return NextResponse.json({ error: "month is required." }, { status: 400 });
  }
  const monthParsed = monthKeySchema.safeParse(monthKey);
  if (!monthParsed.success) {
    return NextResponse.json({ error: "Invalid month format." }, { status: 400 });
  }

  const { start, end } = monthRange(monthKey);

  const [budgetRows, expenseRows] = await Promise.all([
    prisma.monthlyBudget.findMany({
      where: { userId, monthKey },
      include: {
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        spentOn: { gte: start, lt: end },
      },
      _sum: { amountCents: true },
    }),
  ]);

  const actualByCategory = new Map(
    expenseRows.map((row) => [row.categoryId, row._sum.amountCents ?? 0]),
  );

  const categories = budgetRows.map((row) => {
    const actualCents = actualByCategory.get(row.categoryId) ?? 0;
    const budgetCents = row.budgetCents;
    return {
      categoryId: row.categoryId,
      categoryName: row.category.name,
      budget: budgetCents / 100,
      actual: actualCents / 100,
      difference: computeBudgetDifference(budgetCents, actualCents) / 100,
    };
  });

  return NextResponse.json({ monthKey, categories });
}
