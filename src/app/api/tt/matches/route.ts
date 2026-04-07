import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10), 200);

  try {
    const matches = await prisma.tTMatch.findMany({
      orderBy: { date: "desc" },
      take: limit,
    });
    return NextResponse.json(matches);
  } catch (err) {
    console.error("[tt/matches] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, opponent, result, blade, opponentNotes, scores, tournament, whatWorked, whatBroke, tacticalNotes, servesUsed, receiveNotes, peakMode } = body as {
    date?: string;
    opponent?: string;
    result?: string;
    blade?: string;
    opponentNotes?: string;
    scores?: unknown;
    tournament?: string;
    whatWorked?: string;
    whatBroke?: string;
    tacticalNotes?: string;
    servesUsed?: string;
    receiveNotes?: string;
    peakMode?: number;
  };

  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });
  if (!opponent) return NextResponse.json({ error: "opponent is required" }, { status: 400 });
  if (!result) return NextResponse.json({ error: "result is required" }, { status: 400 });
  if (!blade) return NextResponse.json({ error: "blade is required" }, { status: 400 });

  try {
    const match = await prisma.tTMatch.create({
      data: {
        date: new Date(date),
        opponent,
        result,
        blade,
        opponentNotes: opponentNotes ?? null,
        scores: scores !== undefined ? (scores as Prisma.InputJsonValue) : undefined,
        tournament: tournament ?? null,
        whatWorked: whatWorked ?? null,
        whatBroke: whatBroke ?? null,
        tacticalNotes: tacticalNotes ?? null,
        servesUsed: servesUsed ?? null,
        receiveNotes: receiveNotes ?? null,
        peakMode: peakMode ?? null,
      },
    });
    return NextResponse.json(match, { status: 201 });
  } catch (err) {
    console.error("[tt/matches] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
