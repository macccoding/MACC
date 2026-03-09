import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { processKemiMessage } from "@/lib/kemi/agent";

export const maxDuration = 60;

/** Friendly labels for tool names shown in the chat UI */
const TOOL_LABELS: Record<string, string> = {
  get_habits: "Checking habits…",
  log_habit: "Logging habit…",
  get_goals: "Reviewing goals…",
  add_goal: "Adding goal…",
  update_goal: "Updating goal…",
  get_health_data: "Checking health data…",
  log_health_data: "Logging health data…",
  get_portfolio: "Checking portfolio…",
  get_finances: "Reviewing finances…",
  get_reading_list: "Checking reading list…",
  add_to_reading_list: "Adding to reading list…",
  get_captures: "Checking captures…",
  add_capture: "Saving capture…",
  get_learning_tracks: "Checking learning tracks…",
  create_learning_track: "Creating learning track…",
  get_journal: "Reading journal…",
  create_journal_entry: "Writing journal entry…",
  get_people: "Checking contacts…",
  add_person: "Adding contact…",
  get_travel: "Checking travel plans…",
  add_trip: "Adding trip…",
  get_creative: "Checking creative projects…",
  add_project: "Adding project…",
  get_blueprint: "Reviewing blueprints…",
  read_email: "Reading emails…",
  send_email: "Sending email…",
  get_calendar: "Checking calendar…",
  create_calendar_event: "Creating calendar event…",
  read_sheets: "Reading spreadsheet…",
  search_sheets: "Searching spreadsheet…",
  log_action: "Logging action…",
  get_action_log: "Checking action log…",
  remember: "Saving to memory…",
  recall: "Searching memory…",
  log_mood: "Logging mood…",
  get_mood: "Checking mood history…",
  start_focus: "Starting focus session…",
  get_focus_stats: "Checking focus stats…",
  get_weekly_review: "Loading weekly review…",
  get_insights: "Checking insights…",
};

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  let message: string;
  let history: Array<{ role: string; content: string }>;
  let conversationId: string | undefined;

  try {
    const body = await request.json();
    message = body.message;
    history = body.history ?? [];
    conversationId = body.conversationId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const content = await processKemiMessage(
          message.trim(),
          "web",
          false,
          undefined,
          history,
          conversationId,
          (toolName: string) => {
            const label = TOOL_LABELS[toolName] || `Using ${toolName}…`;
            const event = `data: ${JSON.stringify({ type: "tool", label })}\n\n`;
            controller.enqueue(encoder.encode(event));
          },
        );

        const done = `data: ${JSON.stringify({ type: "done", content })}\n\n`;
        controller.enqueue(encoder.encode(done));
      } catch (err) {
        console.error("[kemi] Agent error:", err);
        const error = `data: ${JSON.stringify({ type: "error", content: "Something went wrong. Try again." })}\n\n`;
        controller.enqueue(encoder.encode(error));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
