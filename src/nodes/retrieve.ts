import type { GraphStateType } from "../state.js";
import { similaritySearch } from "../vectorstore/pgvector.js";

export async function retrieve(state: GraphStateType) {
  const query = state.rewrittenQuestion || state.question;
  const documents = await similaritySearch(query, 4);
  return { documents };
}
