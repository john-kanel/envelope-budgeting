import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { categorySchema } from "@/lib/validators";
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
  const parsed = await parseJsonBody(request, categorySchema);
  if (!parsed.ok) return parsed.response;

  const existing = await prisma.category.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        isActive: parsed.data.isActive ?? existing.isActive,
      },
    });

    return NextResponse.json({ category });
  } catch {
    return NextResponse.json(
      { error: "Category name already exists." },
      { status: 409 },
    );
  }
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
  const existing = await prisma.category.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const linkedExpenses = await prisma.expense.count({
    where: { categoryId: id, userId },
  });

  if (linkedExpenses > 0) {
    return NextResponse.json(
      { error: "Cannot delete category with expenses. Set inactive instead." },
      { status: 400 },
    );
  }

  await prisma.monthlyBudget.deleteMany({ where: { categoryId: id, userId } });
  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
