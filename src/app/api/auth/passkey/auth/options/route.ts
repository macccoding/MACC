import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { rpID } from "@/lib/webauthn";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";

// Module-level challenge store (single-user app)
export const authChallengeStore = new Map<string, string>();

export async function POST() {
  const passkeys = await prisma.passkey.findMany();

  if (passkeys.length === 0) {
    return NextResponse.json(
      { error: "No passkeys registered" },
      { status: 404 }
    );
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: passkeys.map((pk) => ({
      id: pk.credentialId,
      transports: pk.transports as AuthenticatorTransportFuture[],
    })),
    userVerification: "preferred",
  });

  authChallengeStore.set("mike", options.challenge);

  return NextResponse.json(options);
}
