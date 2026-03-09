import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN_PERSONAL;

  const envCheck = {
    GOOGLE_CLIENT_ID: clientId ? `set (${clientId.length} chars)` : "MISSING",
    GOOGLE_CLIENT_SECRET: clientSecret ? `set (${clientSecret.length} chars)` : "MISSING",
    GOOGLE_REFRESH_TOKEN_PERSONAL: refreshToken ? `set (${refreshToken.length} chars)` : "MISSING",
  };

  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json({ ok: false, envCheck, error: "Missing env vars" });
  }

  try {
    const { google } = await import("googleapis");
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const result = await calendar.events.list({
      calendarId: "primary",
      maxResults: 1,
      timeMin: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      envCheck,
      calendarTest: {
        status: result.status,
        eventsFound: result.data.items?.length ?? 0,
        calendarSummary: result.data.summary,
      },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, envCheck, error });
  }
}
