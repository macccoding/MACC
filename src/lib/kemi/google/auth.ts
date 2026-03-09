import { google } from "googleapis";

export type GoogleAccount = "personal";

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN_PERSONAL;

  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is missing or empty");
  if (!clientSecret) throw new Error("GOOGLE_CLIENT_SECRET is missing or empty");
  if (!refreshToken) throw new Error("GOOGLE_REFRESH_TOKEN_PERSONAL is missing or empty");

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

export function getGmail() {
  return google.gmail({ version: "v1", auth: getOAuth2Client() });
}

export function getCalendarClient() {
  return google.calendar({ version: "v3", auth: getOAuth2Client() });
}

export function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getOAuth2Client() });
}
