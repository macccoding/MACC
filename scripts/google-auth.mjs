/**
 * Generate Google OAuth2 refresh tokens for Kemi.
 *
 * Usage:
 *   node scripts/google-auth.mjs
 *
 * 1. Opens browser to Google consent screen
 * 2. You sign in and grant access
 * 3. Copy the code from the URL bar (after "code=" in the redirect URL)
 * 4. Paste it into the terminal
 * 5. Prints the refresh token
 */

import { google } from "googleapis";
import { execSync } from "child_process";
import { config } from "dotenv";
import { resolve } from "path";
import { createInterface } from "readline";

config({ path: resolve(process.cwd(), ".env.local") });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// Use "out of band" style — redirect to localhost:1 which fails, user copies code from URL
const REDIRECT_URI = "http://127.0.0.1";
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/spreadsheets",
];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("\n🔑 Opening Google sign-in...\n");

try {
  execSync(`open "${authUrl}"`);
} catch {
  console.log("Open this URL in your browser:\n");
  console.log(authUrl);
}

console.log(`
After signing in, you'll be redirected to a page that won't load.
That's expected! Look at the URL bar — it will look like:

  http://127.0.0.1/?code=4/0AXXXXXXXXX...&scope=...

Copy everything between "code=" and "&scope" and paste it below.
`);

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question("Paste the code here: ", async (code) => {
  rl.close();

  const trimmed = decodeURIComponent(code.trim());

  try {
    const { tokens } = await oauth2.getToken(trimmed);

    console.log("\n═══════════════════════════════════════════");
    console.log("✅ Refresh token generated!\n");
    console.log(tokens.refresh_token);
    console.log("\n═══════════════════════════════════════════");
    console.log("\nCopy the token above into .env.local and Vercel.");
    console.log("Run this script again for each Google account.\n");
  } catch (err) {
    console.error("\n❌ Token exchange failed:", err.message);
    console.error("Make sure you copied the full code from the URL.\n");
  }

  process.exit(0);
});
