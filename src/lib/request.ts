import { z } from "zod";
import { NextResponse } from "next/server";

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return {
        ok: false as const,
        response: NextResponse.json({ error: "Invalid request data." }, { status: 400 }),
      };
    }

    return { ok: true as const, data: parsed.data };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Malformed JSON body." }, { status: 400 }),
    };
  }
}
