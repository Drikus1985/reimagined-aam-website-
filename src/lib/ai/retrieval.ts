import { prisma } from "../db";

/**
 * Knowledge retrieval for RAG. Current implementation is keyword scoring over
 * approved KnowledgeChunk rows — deliberately simple and dependency-free.
 *
 * The abstraction point is this function's signature: swap the internals for
 * a vector store (pgvector + an embeddings provider writing to
 * KnowledgeChunk.embedding) without touching callers. Only approved chunks
 * are ever retrievable.
 */
export async function retrieveKnowledge(query: string, limit = 4): Promise<
  { title: string; sourceType: string; content: string; score: number }[]
> {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  if (terms.length === 0) return [];

  const chunks = await prisma.knowledgeChunk.findMany({ where: { approved: true } });
  const scored = chunks
    .map((c) => {
      const haystackTitle = c.title.toLowerCase();
      const haystackBody = c.content.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (haystackTitle.includes(t)) score += 3;
        const matches = haystackBody.split(t).length - 1;
        score += Math.min(matches, 5);
      }
      return { title: c.title, sourceType: c.sourceType, content: c.content, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
