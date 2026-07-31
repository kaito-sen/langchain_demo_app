import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { embeddings } from "../chains/embeddings.js";
import { env } from "../config/env.js";

let store: PGVectorStore | null = null;

export async function getVectorStore(): Promise<PGVectorStore> {
  if (store) return store;

  store = await PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions: {
      host: env.PG_HOST,
      port: env.PG_PORT,
      user: env.PG_USER,
      password: env.PG_PASSWORD,
      database: env.PG_DATABASE,
    },
    tableName: env.PG_VECTOR_TABLE,
  });

  return store;
}

export async function similaritySearch(
  query: string,
  k: number = 4
): Promise<{ pageContent: string; metadata: Record<string, unknown> }[]> {
  const vs = await getVectorStore();
  const vector = await embeddings.embedQuery(query);
  const results = await vs.similaritySearchVectorWithScores(vector, k);
  return results.map(([doc, score]) => ({
    pageContent: doc.pageContent,
    metadata: doc.metadata ?? {},
  }));
}
