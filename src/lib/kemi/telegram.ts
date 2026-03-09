const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const MIKE_CHAT_ID = process.env.MIKE_TELEGRAM_CHAT_ID || "";
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export { MIKE_CHAT_ID };

export async function sendTelegramMessage(
  text: string,
  chatId: string = MIKE_CHAT_ID,
) {
  if (!BOT_TOKEN) return;
  // Try Markdown first, fall back to plain text if it fails
  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
  if (!res.ok) {
    // Retry without parse_mode (Markdown special chars cause failures)
    await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  }
}

export async function downloadTelegramFile(fileId: string): Promise<Buffer> {
  const fileRes = await fetch(`${API_BASE}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  const filePath = fileData.result.file_path;
  const downloadRes = await fetch(
    `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`,
  );
  return Buffer.from(await downloadRes.arrayBuffer());
}
