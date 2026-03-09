import { SOUL, CONTEXT_MIKE, CONTEXT_PEOPLE, CONTEXT_BUSINESSES } from "./soul";
import { getMoodContext } from "./mood";
import { AUTONOMY_RULES } from "./autonomy";
import type { ContextBlock } from "./context-manager";
import { formatJamaicaTime } from "./context";

/**
 * Assemble the full Kemi system prompt from soul files, mood, autonomy rules,
 * live context blocks, and tool instructions.
 */
export function buildSystemPrompt(contextBlocks: ContextBlock[]): string {
  const sections: string[] = [];

  // Core identity
  sections.push(SOUL);

  // Mike's profile
  sections.push(CONTEXT_MIKE);

  // Key people
  sections.push(CONTEXT_PEOPLE);

  // Business context
  sections.push(CONTEXT_BUSINESSES);

  // Time-based mood
  sections.push(getMoodContext());

  // Autonomy rules
  sections.push(AUTONOMY_RULES);

  // Current timestamp
  sections.push(`## Current Time\n\n${formatJamaicaTime()}`);

  // Live data context
  if (contextBlocks.length > 0) {
    const contextSection = contextBlocks
      .map((block) => `### ${block.label}\n${block.content}`)
      .join("\n\n");
    sections.push(`## Live Data Context\n\n${contextSection}`);
  }

  // Tool usage instructions
  sections.push(`## Tool Usage

You have access to tools that read and write to Mike's Life OS dashboard.
Use them to answer questions with real data — never guess or hallucinate numbers.
When logging or creating data, confirm what you did.
Keep tool calls efficient — don't fetch data you don't need.

### Available Tool Categories

- **Habits**: get_habits, log_habit — track daily habits and streaks
- **Goals**: get_goals, add_goal, update_goal — manage goals and milestones
- **Health**: get_health_data, log_health_data — steps, sleep, weight, etc.
- **Mood & Energy**: log_mood, get_mood — mood/energy check-ins (1-5 scale)
- **Focus**: start_focus, get_focus_stats — pomodoro/deep work sessions
- **Finances**: get_portfolio, get_finances — investments and net worth
- **Reading**: get_reading_list, add_to_reading_list — books and articles
- **Learning**: get_learning_tracks, create_learning_track — skill tracks
- **Journal**: get_journal, create_journal_entry — daily reflections
- **Captures**: get_captures, add_capture — quick thoughts and ideas
- **People/CRM**: get_contacts, create_contact, update_contact, search_contacts, set_contact_frequency, log_interaction — full contact management with relationship tracking, interaction history, and reachout scheduling
- **Travel**: get_travel, add_trip — trip planning
- **Creative**: get_creative, add_project — creative projects
- **Blueprint**: get_blueprint — life blueprints and plans
- **Email**: read_email, send_email — Gmail integration
- **Calendar**: get_calendar, create_calendar_event — Google Calendar
- **Sheets**: read_sheets, search_sheets — Google Sheets
- **Memory**: remember, recall — long-term memory storage and retrieval
- **Action Log**: log_action, get_action_log — audit trail
- **Personal Entries**: log_personal_entry — expenses, income, health events, learning notes
- **Insights**: get_insights — cross-module AI insights
- **Weekly Review**: get_weekly_review — weekly stats and reflections

When Mike asks about contacts, people, relationships, or reaching out to someone, use the People/CRM tools.`);

  return sections.join("\n\n---\n\n");
}
