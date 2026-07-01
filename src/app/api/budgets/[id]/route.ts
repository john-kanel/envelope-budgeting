import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";

type Params = Promise<{ id: string }>;

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const budget = await prisma.monthlyBudget.findFirst({
    where: { id, userId },
  });
  if (!budget) {
    return NextResponse.json({ error: "Budget row not found." }, { status: 404 });
  }

  await prisma.monthlyBudget.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
