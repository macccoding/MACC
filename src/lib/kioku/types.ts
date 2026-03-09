export interface ExtractedNode {
  name: string;
  tags: string[];
  fields: Record<string, unknown>;
}

export interface ExtractedLink {
  source: string;
  target: string;
  rel: string;
}

export interface ExtractedUpdate {
  node: string;
  append: string;
}

export interface CuriosityEntry {
  observation: string;
  relevance: string;
}

export interface ExtractionResult {
  nodes: ExtractedNode[];
  links: ExtractedLink[];
  updates: ExtractedUpdate[];
  reply: string;
  follow_up: string;
  curiosity: CuriosityEntry[];
}

export interface ProcessResult {
  reply: string;
  follow_up: string;
  created: string[];
  updated: string[];
  source_type: string;
}

export interface IngestResult {
  source_type: string;
  text: string;
  metadata: Record<string, string>;
}

export interface KiokuNode {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  status: string;
  fields: Record<string, unknown>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryResult {
  content: string;
  similarity: number;
}

export interface Insight {
  kind: "unconnected_cluster" | "stale_thread" | "emerging_theme";
  description: string;
  relatedNodes: string[];
}

// Legacy type kept for backward compatibility with existing extract.ts
export interface ExtractedEntity {
  subject: string;
  predicate: string;
  object: string;
}
