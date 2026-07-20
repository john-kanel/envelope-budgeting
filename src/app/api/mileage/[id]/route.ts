import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { mileageTripPatchSchema } from "@/lib/validators";
import { milesToTimes100, serializeMileageTrip } from "@/lib/mileage";
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
  const existing = await prisma.mileageTrip.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Mileage trip not found." }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, mileageTripPatchSchema);
  if (!parsed.ok) return parsed.response;

  const trip = await prisma.mileageTrip.update({
    where: { id },
    data: {
      ...(parsed.data.miles !== undefined
        ? { milesTimes100: milesToTimes100(parsed.data.miles) }
        : {}),
      ...(parsed.data.tripDate !== undefined
        ? { tripDate: new Date(parsed.data.tripDate) }
        : {}),
      ...(parsed.data.purpose !== undefined
        ? { purpose: parsed.data.purpose || null }
        : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note || null } : {}),
      ...(parsed.data.isReimbursed !== undefined
        ? { isReimbursed: parsed.data.isReimbursed }
        : {}),
    },
  });

  return NextResponse.json({
    trip: serializeMileageTrip(trip),
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
  const existing = await prisma.mileageTrip.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Mileage trip not found." }, { status: 404 });
  }

  await prisma.mileageTrip.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
