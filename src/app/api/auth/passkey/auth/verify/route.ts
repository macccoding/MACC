import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { rpID, origin } from "@/lib/webauthn";
import { authChallengeStore } from "@/lib/auth-challenge-store";

export async function POST(request: NextRequest) {
  const { credential } = await request.json();

  const expectedChallenge = authChallengeStore.get("mike");
  if (!expectedChallenge) {
    return NextResponse.json(
      { error: "No challenge found. Start authentication again." },
      { status: 400 }
    );
  }

  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: credential.id },
  });

  if (!passkey) {
    return NextResponse.json(
      { error: "Passkey not found" },
      { status: 400 }
    );
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as ("ble" | "cable" | "hybrid" | "internal" | "nfc" | "smart-card" | "usb")[],
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    // Update counter and lastUsedAt
    await prisma.passkey.update({
      where: { credentialId: credential.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    authChallengeStore.delete("mike");

    // Set session cookie (same as PIN route)
    const response = NextResponse.json({ verified: true });
    response.cookies.set("mikeos-session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Authentication verification error:", err);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 400 }
    );
  }
}
