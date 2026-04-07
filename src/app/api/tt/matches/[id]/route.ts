import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const match = await prisma.tTMatch.findUnique({ where: { id } });
    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(match);
  } catch (err) {
    console.error("[tt/matches/[id]] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const existing = await prisma.tTMatch.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

    const match = await prisma.tTMatch.update({
      where: { id },
      data: {
        ...(date ? { date: new Date(date) } : {}),
        ...(opponent ? { opponent } : {}),
        ...(result ? { result } : {}),
        ...(blade ? { blade } : {}),
        ...(opponentNotes !== undefined ? { opponentNotes } : {}),
        ...(scores !== undefined ? { scores: scores as Prisma.InputJsonValue } : {}),
        ...(tournament !== undefined ? { tournament } : {}),
        ...(whatWorked !== undefined ? { whatWorked } : {}),
        ...(whatBroke !== undefined ? { whatBroke } : {}),
        ...(tacticalNotes !== undefined ? { tacticalNotes } : {}),
        ...(servesUsed !== undefined ? { servesUsed } : {}),
        ...(receiveNotes !== undefined ? { receiveNotes } : {}),
        ...(peakMode !== undefined ? { peakMode } : {}),
      },
    });
    return NextResponse.json(match);
  } catch (err) {
    console.error("[tt/matches/[id]] PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const existing = await prisma.tTMatch.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.tTMatch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[tt/matches/[id]] DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
