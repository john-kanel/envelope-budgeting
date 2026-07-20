import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/api-auth";
import { mileageTripSchema, monthKeySchema } from "@/lib/validators";
import { milesToTimes100, serializeMileageTrip } from "@/lib/mileage";
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
    tripDate?: { gte: Date; lt: Date };
  } = { userId };

  if (monthKey) {
    const monthParsed = monthKeySchema.safeParse(monthKey);
    if (!monthParsed.success) {
      return NextResponse.json({ error: "Invalid month format." }, { status: 400 });
    }
    const { start, end } = monthRange(monthKey);
    where.tripDate = { gte: start, lt: end };
  }

  const trips = await prisma.mileageTrip.findMany({
    where,
    orderBy: [{ tripDate: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    trips: trips.map(serializeMileageTrip),
  });
}

export async function POST(request: Request) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, mileageTripSchema);
  if (!parsed.ok) return parsed.response;

  const trip = await prisma.mileageTrip.create({
    data: {
      userId,
      milesTimes100: milesToTimes100(parsed.data.miles),
      tripDate: new Date(parsed.data.tripDate),
      purpose: parsed.data.purpose || null,
      note: parsed.data.note || null,
      isReimbursed: parsed.data.isReimbursed ?? false,
    },
  });

  return NextResponse.json(
    {
      trip: serializeMileageTrip(trip),
    },
    { status: 201 },
  );
}
