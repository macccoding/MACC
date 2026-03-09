import { NextRequest, NextResponse } from "next/server";
import {
  sendTelegramMessage,
  sendTypingIndicator,
  downloadTelegramFile,
} from "@/lib/kemi/telegram";
import { setPreference } from "@/lib/kemi/preferences";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const update = await request.json();
  const message = update.message;
  if (!message) return NextResponse.json({ ok: true });

  // Auth: only process Mike's messages
  const chatId = String(message.chat.id).trim();
  const expectedId = (process.env.MIKE_TELEGRAM_CHAT_ID || "").trim();
  if (!expectedId || chatId !== expectedId) {
    console.log(`[telegram] Auth rejected: chat=${chatId} expected=${expectedId}`);
    return NextResponse.json({ ok: true });
  }

  let text = message.text || "";
  let isVoiceNote = false;
  let originalVoiceText: string | undefined;

  // Handle voice messages via Whisper
  if (message.voice) {
    isVoiceNote = true;
    try {
      const audioBuffer = await downloadTelegramFile(message.voice.file_id);
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI();
      const file = new File(
        [new Uint8Array(audioBuffer)],
        "voice.ogg",
        { type: "audio/ogg" },
      );
      const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file,
        language: "en",
        prompt:
          "Jamaican English and Patois. Names: Juddy, Camille, Jermone, Claudette, Aleer, Arlene, Manda, Matthieu, Jamie, Sabrina, Charles. Businesses: SuperPlus, GasMart, Kingsland Kitchen, D'Ville, Istry, Caricom Freight. Places: Mandeville, Kingsland, Opa Locka.",
      });
      originalVoiceText = transcription.text;
      text = transcription.text;
    } catch (e) {
      console.error("Voice transcription failed:", e);
      await sendTelegramMessage(
        "Couldn't transcribe that voice note. Try again?",
      );
      return NextResponse.json({ ok: true });
    }
  }

  if (!text) return NextResponse.json({ ok: true });

  // Kill switch
  const upper = text.trim().toUpperCase();
  if (upper === "STOP") {
    await setPreference("kill_switch", true);
    await sendTelegramMessage(
      "Kill switch activated. I'll only respond — no autonomous actions until you say RESUME.",
    );
    return NextResponse.json({ ok: true });
  }
  if (upper === "RESUME") {
    await setPreference("kill_switch", false);
    await sendTelegramMessage("Resumed. Back to full autonomous mode.");
    return NextResponse.json({ ok: true });
  }

  try {
    // Show "typing..." and refresh every 4s while processing
    await sendTypingIndicator();
    const typingInterval = setInterval(() => sendTypingIndicator(), 4000);

    const { processKemiMessage } = await import("@/lib/kemi/agent");
    const response = await processKemiMessage(
      text,
      "telegram",
      isVoiceNote,
      originalVoiceText,
    );

    clearInterval(typingInterval);
    await sendTelegramMessage(response);
    return NextResponse.json({ ok: true, responded: true });
  } catch (e) {
    const errMsg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
    console.error("Telegram processing error:", errMsg);
    await sendTelegramMessage(
      `Error: ${e instanceof Error ? e.message : String(e)}`,
    );
    return NextResponse.json({ ok: false, error: errMsg });
  }
}
