import Anthropic from "@anthropic-ai/sdk";
import type { IngestResult } from "./types";

const anthropic = new Anthropic();

export async function ingest(
  sourceType: string,
  data: Buffer | string,
  options: Record<string, string> = {},
): Promise<IngestResult> {
  switch (sourceType) {
    case "image":
      return ingestImage(data as Buffer, options);
    case "url":
      return ingestUrl(data as string);
    case "pdf":
      return ingestPdf(data as Buffer, options);
    default:
      return { source_type: sourceType, text: String(data), metadata: {} };
  }
}

async function ingestImage(
  imageBuffer: Buffer,
  options: Record<string, string>,
): Promise<IngestResult> {
  const base64 = imageBuffer.toString("base64");
  const mediaType = options.mimeType || "image/jpeg";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as
                | "image/jpeg"
                | "image/png"
                | "image/gif"
                | "image/webp",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Describe this image in detail. Extract any text, names, places, dates, or notable information. Be thorough but concise.",
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return {
    source_type: "image",
    text,
    metadata: { mimeType: mediaType, size: String(imageBuffer.length) },
  };
}

async function ingestUrl(url: string): Promise<IngestResult> {
  try {
    const res = await fetch(url);
    const html = await res.text();
    // Simple HTML to text: strip tags, decode entities, collapse whitespace
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000);
    return { source_type: "url", text, metadata: { url } };
  } catch {
    return {
      source_type: "url",
      text: "",
      metadata: { url, error: "Failed to fetch" },
    };
  }
}

async function ingestPdf(
  pdfBuffer: Buffer,
  options: Record<string, string>,
): Promise<IngestResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    const result = await pdfParse(pdfBuffer);
    const text = result.text.slice(0, 10000);
    return {
      source_type: "pdf",
      text,
      metadata: {
        pages: String(result.numpages),
        filename: options.filename || "unknown.pdf",
      },
    };
  } catch {
    return {
      source_type: "pdf",
      text: "",
      metadata: { error: "Failed to parse PDF" },
    };
  }
}
