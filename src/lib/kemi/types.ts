export interface KemiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface KemiResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
