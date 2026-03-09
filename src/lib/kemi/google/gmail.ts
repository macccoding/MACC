import { getGmail, type GoogleAccount } from "./auth";

export async function getUnreadEmails(account: GoogleAccount = "business", maxResults = 10) {
  const gmail = getGmail(account);
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults,
  });
  if (!res.data.messages) return [];
  const emails = await Promise.all(
    res.data.messages.map(async (m) => {
      const msg = await gmail.users.messages.get({ userId: "me", id: m.id! });
      const headers = msg.data.payload?.headers || [];
      return {
        id: m.id,
        subject: headers.find((h) => h.name === "Subject")?.value || "",
        from: headers.find((h) => h.name === "From")?.value || "",
        date: headers.find((h) => h.name === "Date")?.value || "",
        snippet: msg.data.snippet || "",
      };
    }),
  );
  return emails;
}

export async function getEmailBody(account: GoogleAccount, messageId: string) {
  const gmail = getGmail(account);
  const msg = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });
  const parts = msg.data.payload?.parts || [];
  const textPart = parts.find((p) => p.mimeType === "text/plain");
  const body = textPart?.body?.data
    ? Buffer.from(textPart.body.data, "base64").toString()
    : msg.data.snippet || "";
  const headers = msg.data.payload?.headers || [];
  return {
    id: msg.data.id,
    subject: headers.find((h) => h.name === "Subject")?.value || "",
    from: headers.find((h) => h.name === "From")?.value || "",
    to: headers.find((h) => h.name === "To")?.value || "",
    date: headers.find((h) => h.name === "Date")?.value || "",
    bodyText: body,
    snippet: msg.data.snippet || "",
  };
}

export async function sendEmail(
  account: GoogleAccount,
  to: string,
  subject: string,
  body: string,
  threadId?: string,
) {
  const gmail = getGmail(account);
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`,
  ).toString("base64url");
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw, threadId },
  });
  return res.data;
}

export async function searchEmails(
  account: GoogleAccount,
  query: string,
  maxResults = 10,
) {
  const gmail = getGmail(account);
  const res = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
  });
  if (!res.data.messages) return [];
  const emails = await Promise.all(
    res.data.messages.map(async (m) => {
      const msg = await gmail.users.messages.get({ userId: "me", id: m.id! });
      const headers = msg.data.payload?.headers || [];
      return {
        id: m.id,
        subject: headers.find((h) => h.name === "Subject")?.value || "",
        from: headers.find((h) => h.name === "From")?.value || "",
        date: headers.find((h) => h.name === "Date")?.value || "",
        snippet: msg.data.snippet || "",
      };
    }),
  );
  return emails;
}

export async function getEmailSummary(account: GoogleAccount) {
  const gmail = getGmail(account);
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults: 1,
  });
  return {
    account,
    unreadCount: res.data.resultSizeEstimate || 0,
  };
}
