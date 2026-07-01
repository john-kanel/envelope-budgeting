import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { monthRange, priorMonthKey } from "@/lib/month";
import { monthKeySchema } from "@/lib/validators";
import {
  computeBudgetDifference,
  computeEstimatedBalance,
  computeNet,
} from "@/lib/reporting";

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

  const currentRange = monthRange(monthKey);
  const previousRange = monthRange(priorMonthKey(monthKey));
  const allTimeEnd = currentRange.end;

  const [
    user,
    currentExpenseAggregate,
    previousExpenseAggregate,
    currentIncomeAggregate,
    previousIncomeAggregate,
    taxAggregate,
    allExpensesAggregate,
    allIncomeAggregate,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { startingBalanceCents: true },
    }),
    prisma.expense.aggregate({
      where: {
        userId,
        spentOn: { gte: currentRange.start, lt: currentRange.end },
      },
      _sum: { amountCents: true },
    }),
    prisma.expense.aggregate({
      where: {
        userId,
        spentOn: { gte: previousRange.start, lt: previousRange.end },
      },
      _sum: { amountCents: true },
    }),
    prisma.income.aggregate({
      where: {
        userId,
        receivedOn: { gte: currentRange.start, lt: currentRange.end },
      },
      _sum: { amountCents: true },
    }),
    prisma.income.aggregate({
      where: {
        userId,
        receivedOn: { gte: previousRange.start, lt: previousRange.end },
      },
      _sum: { amountCents: true },
    }),
    prisma.expense.aggregate({
      where: {
        userId,
        spentOn: { gte: currentRange.start, lt: currentRange.end },
        isTaxDeductible: true,
      },
      _sum: { amountCents: true },
    }),
    prisma.expense.aggregate({
      where: {
        userId,
        spentOn: { lt: allTimeEnd },
      },
      _sum: { amountCents: true },
    }),
    prisma.income.aggregate({
      where: {
        userId,
        receivedOn: { lt: allTimeEnd },
      },
      _sum: { amountCents: true },
    }),
  ]);

  const currentExpenses = currentExpenseAggregate._sum.amountCents ?? 0;
  const previousExpenses = previousExpenseAggregate._sum.amountCents ?? 0;
  const currentIncome = currentIncomeAggregate._sum.amountCents ?? 0;
  const previousIncome = previousIncomeAggregate._sum.amountCents ?? 0;
  const startingBalance = user?.startingBalanceCents ?? 0;

  const budgetAggregate = await prisma.monthlyBudget.aggregate({
    where: { userId, monthKey },
    _sum: { budgetCents: true },
  });
  const budgetTotal = budgetAggregate._sum.budgetCents ?? 0;
  const currentNet = computeNet(currentIncome, currentExpenses);
  const previousNet = computeNet(previousIncome, previousExpenses);
  const allExpenses = allExpensesAggregate._sum.amountCents ?? 0;
  const allIncome = allIncomeAggregate._sum.amountCents ?? 0;
  const estimatedBalance = computeEstimatedBalance(
    startingBalance,
    allIncome,
    allExpenses,
  );

  return NextResponse.json({
    monthKey,
    totals: {
      currentExpenses: currentExpenses / 100,
      previousExpenses: previousExpenses / 100,
      currentIncome: currentIncome / 100,
      previousIncome: previousIncome / 100,
      currentNet: currentNet / 100,
      previousNet: previousNet / 100,
      netMonthOverMonthDelta: (currentNet - previousNet) / 100,
      budgeted: budgetTotal / 100,
      differenceToBudget: computeBudgetDifference(budgetTotal, currentExpenses) / 100,
      taxDeductible: (taxAggregate._sum.amountCents ?? 0) / 100,
      startingBalance: startingBalance / 100,
      estimatedBalance: estimatedBalance / 100,
    },
  });
}
