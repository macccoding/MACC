import { getCalendarClient } from "./auth";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

export async function getEvents(
  startDate: string,
  endDate: string,
) {
  const calendar = getCalendarClient();
  const res = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: new Date(startDate).toISOString(),
    timeMax: new Date(endDate).toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });
  return (res.data.items || []).map((e) => ({
    id: e.id,
    summary: e.summary || "",
    start: e.start?.dateTime || e.start?.date || "",
    end: e.end?.dateTime || e.end?.date || "",
    location: e.location || "",
    description: e.description || "",
    attendees: (e.attendees || []).map((a) => a.email || ""),
  }));
}

export async function getTodayEvents() {
  // Use Jamaica timezone so "today" is correct on Vercel (UTC servers)
  const jamaicaNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Jamaica" })
  );
  const yyyy = jamaicaNow.getFullYear();
  const mm = String(jamaicaNow.getMonth() + 1).padStart(2, "0");
  const dd = String(jamaicaNow.getDate()).padStart(2, "0");
  const start = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000-05:00`);
  const end = new Date(`${yyyy}-${mm}-${dd}T23:59:59.999-05:00`);
  return getEvents(start.toISOString(), end.toISOString());
}

export async function createEvent(
  summary: string,
  start: string,
  end: string,
  description?: string,
  location?: string,
  attendees?: string[],
) {
  const calendar = getCalendarClient();
  const timeZone = process.env.GOOGLE_CALENDAR_TIMEZONE || "America/Jamaica";
  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary,
      start: { dateTime: new Date(start).toISOString(), timeZone },
      end: { dateTime: new Date(end).toISOString(), timeZone },
      description,
      location,
      attendees: attendees?.map((email) => ({ email })),
    },
  });
  return { id: res.data.id, summary: res.data.summary };
}

export async function updateEvent(
  eventId: string,
  updates: {
    summary?: string;
    start?: string;
    end?: string;
    description?: string;
    location?: string;
  },
) {
  const calendar = getCalendarClient();
  const body: Record<string, unknown> = {};
  if (updates.summary) body.summary = updates.summary;
  if (updates.description) body.description = updates.description;
  if (updates.location) body.location = updates.location;
  if (updates.start) body.start = { dateTime: new Date(updates.start).toISOString() };
  if (updates.end) body.end = { dateTime: new Date(updates.end).toISOString() };
  const res = await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId,
    requestBody: body,
  });
  return { id: res.data.id, summary: res.data.summary };
}

export async function deleteEvent(
  eventId: string,
) {
  const calendar = getCalendarClient();
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
  return { deleted: true, eventId };
}
