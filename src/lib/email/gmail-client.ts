import { getGmail } from "@/lib/kemi/google/auth";

/**
 * Re-export the shared Gmail client so email sync uses the same
 * Google OAuth credentials as Kemi (GOOGLE_CLIENT_ID, etc.).
 */
export function getGmailClient() {
  return getGmail();
}
