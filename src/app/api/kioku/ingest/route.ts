import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ingest } from "@/lib/kioku/ingest";
import { processText } from "@/lib/kioku/pipeline";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const sourceType = (formData.get("source_type") as string) || "text";
    const context = formData.get("context") as string | null;
    const url = formData.get("url") as string | null;
    const file = formData.get("file") as File | null;

    let ingestResult;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      ingestResult = await ingest(sourceType, buffer, {
        mimeType: file.type,
        filename: file.name,
      });
    } else if (url) {
      ingestResult = await ingest("url", url);
    } else if (context) {
      ingestResult = await ingest("text", context);
    } else {
      return NextResponse.json({ error: "No input provided" }, { status: 400 });
    }

    if (!ingestResult.text) {
      return NextResponse.json(
        { error: "Could not extract text" },
        { status: 422 },
      );
    }

    const result = await processText(ingestResult.text);
    return NextResponse.json({
      reply: result.reply,
      follow_up: result.follow_up,
      created: result.created,
      updated: result.updated,
      source: ingestResult.metadata,
    });
  } catch (err) {
    console.error("[kioku/ingest] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
