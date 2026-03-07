export interface ExtractedEntity {
  subject: string;
  predicate: string;
  object: string;
}

export interface KiokuNode {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  notes: string;
}

export interface MemoryResult {
  content: string;
  similarity: number;
}
