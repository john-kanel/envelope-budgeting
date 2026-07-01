import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { categorySchema } from "@/lib/validators";
import { parseJsonBody } from "@/lib/request";

export async function GET() {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, categorySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const category = await prisma.category.create({
      data: {
        userId,
        name: parsed.data.name,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Category already exists for this account." },
      { status: 409 },
    );
  }
}
