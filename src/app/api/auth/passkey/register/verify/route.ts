import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rpID, origin } from "@/lib/webauthn";
import { challengeStore } from "../options/route";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { credential, deviceName } = await request.json();

  const expectedChallenge = challengeStore.get("mike");
  if (!expectedChallenge) {
    return NextResponse.json(
      { error: "No challenge found. Start registration again." },
      { status: 400 }
    );
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const { credential: cred } = verification.registrationInfo;

    await prisma.passkey.create({
      data: {
        credentialId: cred.id,
        publicKey: Buffer.from(cred.publicKey),
        counter: BigInt(cred.counter),
        deviceName: deviceName || "Unknown device",
        transports: (cred.transports as string[]) || [],
      },
    });

    challengeStore.delete("mike");

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error("Registration verification error:", err);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 400 }
    );
  }
}
