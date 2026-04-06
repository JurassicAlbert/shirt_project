import { prisma } from "@shirt/infrastructure";

const getEmbedding = async (text: string) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("openai_api_key_missing");
  }
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small",
      input: text,
    }),
  });
  if (!response.ok) {
    throw new Error(`embedding_failed:${response.status}`);
  }
  const json = (await response.json()) as { data: Array<{ embedding: number[] }> };
  return json.data[0]?.embedding;
};

export const upsertProductEmbedding = async (input: { productId: string; text: string }) => {
  const embedding = await getEmbedding(input.text);
  if (!embedding) throw new Error("embedding_empty");
  const vectorLiteral = `[${embedding.join(",")}]`;

  const existing = await prisma.searchEmbedding.findUnique({
    where: { sourceType_sourceId: { sourceType: "internal", sourceId: input.productId } },
  });
  if (existing) {
    await prisma.searchEmbedding.update({
      where: { id: existing.id },
      data: { text: input.text },
    });
    await prisma.$executeRawUnsafe(`UPDATE "SearchEmbedding" SET "embedding"=$1::vector WHERE "id"=$2`, vectorLiteral, existing.id);
    return;
  }

  const created = await prisma.searchEmbedding.create({
    data: { sourceType: "internal", sourceId: input.productId, text: input.text },
  });
  await prisma.$executeRawUnsafe(`UPDATE "SearchEmbedding" SET "embedding"=$1::vector WHERE "id"=$2`, vectorLiteral, created.id);
};

export const searchSimilarProducts = async (query: string, limit = 20) => {
  const embedding = await getEmbedding(query);
  if (!embedding) return [];
  const vectorLiteral = `[${embedding.join(",")}]`;
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT "sourceId", 1 - ("embedding" <=> $1::vector) AS score
     FROM "SearchEmbedding"
     WHERE "sourceType" = 'internal' AND "embedding" IS NOT NULL
     ORDER BY "embedding" <=> $1::vector
     LIMIT $2`,
    vectorLiteral,
    limit,
  )) as Array<{ sourceId: string; score: number }>;
  return rows;
};
