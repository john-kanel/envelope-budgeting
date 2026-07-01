import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { monthRange } from "@/lib/month";

export async function GET(request: Request) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "month is required." }, { status: 400 });
  }

  const { start, end } = monthRange(month);
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      spentOn: { gte: start, lt: end },
      isTaxDeductible: true,
    },
    include: { category: { select: { name: true } } },
    orderBy: [{ spentOn: "asc" }, { createdAt: "asc" }],
  });

  const header = ["date", "amount", "category", "note"];
  const rows = expenses.map((item) => [
    item.spentOn.toISOString().slice(0, 10),
    (item.amountCents / 100).toFixed(2),
    escapeCsv(item.category.name),
    escapeCsv(item.note ?? ""),
  ]);
  const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tax-deductible-${month}.csv"`,
    },
  });
}

function escapeCsv(value: string) {
  if (!value.includes(",") && !value.includes('"') && !value.includes("\n")) {
    return value;
  }
  return `"${value.replaceAll('"', '""')}"`;
}
