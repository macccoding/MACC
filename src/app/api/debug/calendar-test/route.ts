import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { createEvent } = await import("@/lib/kemi/google/calendar");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(15, 0, 0, 0);

    const result = await createEvent(
      "Debug Calendar Test",
      tomorrow.toISOString(),
      end.toISOString(),
    );

    return NextResponse.json({
      ok: true,
      event: result,
      calendarId: process.env.GOOGLE_CALENDAR_ID || "(not set, using primary)",
    });
  } catch (err: unknown) {
    const error = err as { code?: number; message?: string; response?: { data?: unknown } };
    return NextResponse.json({
      ok: false,
      code: error.code,
      message: error.message,
      calendarId: process.env.GOOGLE_CALENDAR_ID || "(not set, using primary)",
      details: error.response?.data,
    }, { status: 500 });
  }
}
