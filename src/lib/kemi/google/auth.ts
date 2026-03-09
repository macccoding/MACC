import { google } from "googleapis";

const ACCOUNTS = {
  business: process.env.GOOGLE_REFRESH_TOKEN_BUSINESS,
  personal: process.env.GOOGLE_REFRESH_TOKEN_PERSONAL,
  tools: process.env.GOOGLE_REFRESH_TOKEN_TOOLS,
} as const;

export type GoogleAccount = keyof typeof ACCOUNTS;

export function getOAuth2Client(account: GoogleAccount = "business") {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2.setCredentials({ refresh_token: ACCOUNTS[account] });
  return oauth2;
}

export function getGmail(account: GoogleAccount = "business") {
  return google.gmail({ version: "v1", auth: getOAuth2Client(account) });
}

export function getCalendarClient(account: GoogleAccount = "business") {
  return google.calendar({ version: "v3", auth: getOAuth2Client(account) });
}

export function getSheetsClient(account: GoogleAccount = "business") {
  return google.sheets({ version: "v4", auth: getOAuth2Client(account) });
}
