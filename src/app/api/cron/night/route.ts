import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/kemi/telegram";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  sendTelegramMessage(
    "Time to wind down. Anything on your mind before sleep? Send me a voice note."
  );

  return NextResponse.json({ ok: true, jobs: ["wind_down_note"] });
}
