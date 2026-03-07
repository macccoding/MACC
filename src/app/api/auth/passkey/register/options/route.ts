import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rpName, rpID } from "@/lib/webauthn";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";

// Module-level challenge store (single-user app)
export const challengeStore = new Map<string, string>();

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const existingPasskeys = await prisma.passkey.findMany();

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: "mike",
    userDisplayName: "Mike",
    excludeCredentials: existingPasskeys.map((pk) => ({
      id: pk.credentialId,
      transports: pk.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  challengeStore.set("mike", options.challenge);

  return NextResponse.json(options);
}
