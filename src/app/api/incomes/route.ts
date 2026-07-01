import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { incomeSchema, monthKeySchema } from "@/lib/validators";
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

  const where: {
    userId: string;
    receivedOn?: { gte: Date; lt: Date };
  } = { userId };

  if (monthKey) {
    const monthParsed = monthKeySchema.safeParse(monthKey);
    if (!monthParsed.success) {
      return NextResponse.json({ error: "Invalid month format." }, { status: 400 });
    }
    const { start, end } = monthRange(monthKey);
    where.receivedOn = { gte: start, lt: end };
  }

  const incomes = await prisma.income.findMany({
    where,
    orderBy: [{ receivedOn: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    incomes: incomes.map((item) => ({
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

  const parsed = await parseJsonBody(request, incomeSchema);
  if (!parsed.ok) return parsed.response;

  const income = await prisma.income.create({
    data: {
      userId,
      amountCents: dollarsToCents(parsed.data.amount),
      receivedOn: new Date(parsed.data.receivedOn),
      source: parsed.data.source || null,
      note: parsed.data.note || null,
    },
  });

  return NextResponse.json(
    {
      income: {
        ...income,
        amount: income.amountCents / 100,
      },
    },
    { status: 201 },
  );
}
