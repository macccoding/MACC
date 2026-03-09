import { getCalendarClient, type GoogleAccount } from "./auth";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

export async function getEvents(
  startDate: string,
  endDate: string,
  account: GoogleAccount = "business",
) {
  const calendar = getCalendarClient(account);
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

export async function getTodayEvents(account: GoogleAccount = "business") {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return getEvents(start.toISOString(), end.toISOString(), account);
}

export async function createEvent(
  summary: string,
  start: string,
  end: string,
  description?: string,
  location?: string,
  attendees?: string[],
  account: GoogleAccount = "business",
) {
  const calendar = getCalendarClient(account);
  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary,
      start: { dateTime: new Date(start).toISOString() },
      end: { dateTime: new Date(end).toISOString() },
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
  account: GoogleAccount = "business",
) {
  const calendar = getCalendarClient(account);
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
  account: GoogleAccount = "business",
) {
  const calendar = getCalendarClient(account);
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
  return { deleted: true, eventId };
}
