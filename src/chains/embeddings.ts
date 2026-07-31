import { OpenAIEmbeddings } from "@langchain/openai";
import { env } from "../config/env.js";

export const embeddings = new OpenAIEmbeddings({
  apiKey: env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: env.OPENROUTER_BASE_URL,
  },
  model: env.EMBEDDING_MODEL,
});
