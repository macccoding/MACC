import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { classifyCapture, executeRoute } from "@/lib/captures/auto-route";
import type { InputJsonValue } from "@prisma/client/runtime/client";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  // Parse body
  let content: string;
  let category: string | undefined;

  try {
    const body = await request.json();
    content = body.content;
    category = body.category;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate content
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  try {
    // Create the capture
    let capture = await prisma.capture.create({
      data: {
        content: content.trim(),
        ...(category ? { category } : {}),
      },
    });

    // Classify with AI
    const classification = await classifyCapture(content.trim());

    // Update capture with classification results
    capture = await prisma.capture.update({
      where: { id: capture.id },
      data: {
        suggestedRoute: classification.route,
        suggestedData: classification.data as InputJsonValue,
        confidence: classification.confidence,
      },
    });

    // Auto-execute if high confidence
    if (classification.confidence >= 0.85 && classification.route !== "none") {
      const result = await executeRoute(
        capture.id,
        classification.route,
        classification.data
      );
      if (result.success) {
        capture = await prisma.capture.findUniqueOrThrow({
          where: { id: capture.id },
        });
      }
    }

    return NextResponse.json(capture, { status: 201 });
  } catch (err) {
    console.error("[captures] Create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  // Build filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};

  if (status === "inbox") {
    where.processed = false;
  } else if (status === "routed") {
    where.processed = true;
    where.routedTo = { not: null };
  } else {
    // Legacy support: ?processed=true/false still works
    const processedParam = searchParams.get("processed");
    if (processedParam === "true") {
      where.processed = true;
    } else if (processedParam === "false") {
      where.processed = false;
    }
  }

  try {
    const captures = await prisma.capture.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(captures);
  } catch (err) {
    console.error("[captures] List error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
